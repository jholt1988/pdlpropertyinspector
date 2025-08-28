import React, { useState, useRef } from 'react';
import { Upload, Plus, FileText, Database, Trash2 } from 'lucide-react';
import { InventoryItem, AnalysisResult, Inspection } from '../../types';
import { runRepairEstimatorAgent } from '../../services/generateEstimate';
import { useStorage } from '../../contexts/StorageContext';
import { inspectionToInventoryItems } from '../../utils/inspectionConverter';
import { createAnalysisResultFromEstimateResult, createFallbackAnalysisResult } from '../../utils/dataNormalization';

interface DataInputProps {
  inventoryData: InventoryItem[];
  setInventoryData: (data: InventoryItem[]) => void;
  setAnalysisResults: (results: AnalysisResult) => void;
  onInspectionImported?: (inspection: Inspection) => void;
}

const DataInput: React.FC<DataInputProps> = ({
  inventoryData,
  setInventoryData,
  setAnalysisResults,
  onInspectionImported
}) => {
  const [inputMethod, setInputMethod] = useState<'csv' | 'json' | 'manual'>('csv');
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    currentCondition: 'Good'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inspections } = useStorage();
  const [selectedInspection, setSelectedInspection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any previous success messages

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        if (inputMethod === 'csv') {
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            setError('CSV file must contain at least a header row and one data row');
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map((line) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const item: any = {};
            headers.forEach((header, index) => {
              const key = header.toLowerCase().replace(/\s+/g, '');
              let value: any = values[index] || '';
              
              // Convert specific fields
              if (key.includes('cost') || key.includes('value')) {
                value = parseFloat(value) || 0;
              } else if (key.includes('date')) {
                value = value || undefined;
              }
              
              // Map common header variations
              if (key.includes('id')) item.itemId = value;
              else if (key.includes('name')) item.itemName = value;
              else if (key.includes('category')) item.category = value;
              else if (key.includes('condition')) item.currentCondition = value;
              else if (key.includes('purchase') && key.includes('date')) item.purchaseDate = value;
              else if (key.includes('maintenance') && key.includes('date')) item.lastMaintenanceDate = value;
              else if (key.includes('original') && key.includes('cost')) item.originalCost = value;
              else if (key.includes('market') && key.includes('value')) item.currentMarketValue = value;
              else if (key.includes('location')) item.location = value;
              else if (key.includes('description')) item.description = value;
            });
            return item as InventoryItem;
          }).filter((item, index) => {
            if (!item.itemId || !item.itemName) {
              console.warn(`Row ${index + 2} missing required fields (itemId or itemName)`);
              return false;
            }
            return true;
          });
          
          if (data.length === 0) {
            setError('No valid items found in CSV file. Please check the format.');
            return;
          }
          
          setInventoryData([...inventoryData, ...data]);
          setError(null); // Clear any existing errors
          setSuccessMessage(`Successfully imported ${data.length} items from CSV file`);
          setTimeout(() => setSuccessMessage(null), 5000);
          
        } else if (inputMethod === 'json') {
          const parsedData = JSON.parse(content);
          const data = Array.isArray(parsedData) ? parsedData : [parsedData];
          
          const validData = data.filter(item => item.itemId && item.itemName);
          if (validData.length === 0) {
            setError('No valid items found in JSON file. Items must have itemId and itemName.');
            return;
          }
          
          setInventoryData([...inventoryData, ...validData]);
          setError(null); // Clear any existing errors
          setSuccessMessage(`Successfully imported ${validData.length} items from JSON file`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
        
        // Clear the file input for next upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Auto-run analysis
        setTimeout(() => runAnalysis(), 100);
        
      } catch (err) {
        console.error('File parse error:', err);
        setError(`Error parsing ${inputMethod.toUpperCase()} file: ${err instanceof Error ? err.message : 'Invalid format'}`);
        // Clear the file input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const addManualItem = () => {
    if (!newItem.itemId || !newItem.itemName || !newItem.category || !newItem.purchaseDate || !newItem.originalCost) {
      setError('Please fill in all required fields');
      return;
    }

    const item: InventoryItem = {
      itemId: newItem.itemId,
      itemName: newItem.itemName,
      category: newItem.category,
      currentCondition: newItem.currentCondition || 'Good',
      purchaseDate: newItem.purchaseDate,
      lastMaintenanceDate: newItem.lastMaintenanceDate,
      originalCost: newItem.originalCost || 0,
      currentMarketValue: newItem.currentMarketValue,
      location: newItem.location,
      description: newItem.description
    };

    setInventoryData([...inventoryData, item]);
    setNewItem({ currentCondition: 'Good' });
  };

  const runAnalysis = async () => {
    if (inventoryData.length === 0) {
      setError('No inventory data to analyze');
      return;
    }
    
    setError(null); // Clear any previous errors
    setSuccessMessage(null); // Clear any success messages
    
    try {
      // Use a default location if not provided
      const res = await runRepairEstimatorAgent(inventoryData, 'Wichita, Kansas', 'USD');
      
      console.log('Estimate result:', res); // Debug log
      const itemized_breakdown = res.itemized_breakdown || [];
      setAnalysisResults(itemized_breakdown.length > 0 ? createAnalysisResultFromEstimateResult(res, inventoryData) : createFallbackAnalysisResult(inventoryData));
      
      // Check if we have breakdown data
      if (!res.itemized_breakdown || res.itemized_breakdown.length === 0) {
        console.log('No itemized breakdown found, creating fallback analysis');
        
        // Use fallback analysis result
        const analysisResults = createFallbackAnalysisResult(inventoryData);
        setAnalysisResults(analysisResults);
        setError(null);
        return;
      }
      
      // Use the normalization utility to create analysis results
      const analysisResults = createAnalysisResultFromEstimateResult(res, inventoryData);
      setAnalysisResults(analysisResults);
      setError(null);
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback to basic analysis on error
      const fallbackResults = createFallbackAnalysisResult(inventoryData);
      setAnalysisResults(fallbackResults);
      setError(null);
    }
  };

  const importFromInspection = async () => {
    const inspection = inspections.find(i => i.id === selectedInspection);
    if (!inspection) {
      setError('Select an inspection to import');
      return;
    }

    const items = inspectionToInventoryItems(inspection);
    if (items.length === 0) {
      setError('No actionable items found in selected inspection');
      return;
    }

    setInventoryData([...inventoryData, ...items]);
    if (onInspectionImported) {
      onInspectionImported(inspection);
    }
    setSelectedInspection('');
    setTimeout(() => runAnalysis(), 100);

  };

  const removeItem = (itemId: string) => {
    setInventoryData(inventoryData.filter(item => item.itemId !== itemId));
  };

  const loadTestData = () => {
    const testItems: InventoryItem[] = [
      {
        itemId: 'test-001',
        itemName: 'Kitchen Faucet',
        category: 'plumbing',
        currentCondition: 'Poor',
        purchaseDate: '2020-01-15',
        lastMaintenanceDate: '2022-06-01',
        originalCost: 150,
        currentMarketValue: 80,
        location: 'Kitchen',
        description: 'Leaking and has mineral buildup'
      },
      {
        itemId: 'test-002',
        itemName: 'Living Room Carpet',
        category: 'flooring',
        currentCondition: 'Damaged',
        purchaseDate: '2019-03-10',
        originalCost: 800,
        currentMarketValue: 200,
        location: 'Living Room',
        description: 'Stained and worn in high traffic areas'
      },
      {
        itemId: 'test-003',
        itemName: 'HVAC Unit',
        category: 'hvac',
        currentCondition: 'Non-functional',
        purchaseDate: '2015-08-20',
        lastMaintenanceDate: '2023-05-15',
        originalCost: 3500,
        currentMarketValue: 500,
        location: 'Utility Room',
        description: 'Compressor failed, not cooling properly'
      },
      {
        itemId: 'test-004',
        itemName: 'Front Door',
        category: 'general',
        currentCondition: 'Good',
        purchaseDate: '2018-11-05',
        originalCost: 600,
        currentMarketValue: 450,
        location: 'Entrance',
        description: 'Minor scratches but functional'
      },
      {
        itemId: 'test-005',
        itemName: 'Bathroom Vanity',
        category: 'general',
        currentCondition: 'Poor',
        purchaseDate: '2017-09-12',
        originalCost: 500,
        currentMarketValue: 200,
        location: 'Master Bathroom',
        description: 'Water damage to cabinet bottom, loose fixtures'
      }
    ];
    
    setInventoryData([...inventoryData, ...testItems]);
    setError(null);
    setSuccessMessage(`Loaded ${testItems.length} test items`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const downloadSampleCSV = () => {
    const csvContent = `ItemID,ItemName,Category,CurrentCondition,PurchaseDate,OriginalCost,CurrentMarketValue,Location,Description
sample-001,"Kitchen Faucet",plumbing,Poor,2020-01-15,150,80,Kitchen,"Leaking and has mineral buildup"
sample-002,"Living Room Carpet",flooring,Damaged,2019-03-10,800,200,"Living Room","Stained and worn in high traffic areas"
sample-003,"HVAC Unit",hvac,Non-functional,2015-08-20,3500,500,"Utility Room","Compressor failed not cooling properly"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md">
          {successMessage}
        </div>
      )}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Input</h2>
            <p className="text-gray-600">
              Import inventory data from CSV/JSON files or add items manually.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadSampleCSV}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Download Sample CSV
            </button>
            <button
              onClick={loadTestData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Load Test Data
            </button>
          </div>
        </div>
      </div>

      {/* Input Method Selection */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(
            [
              { id: 'csv' as const, label: 'CSV Upload', icon: FileText },
              { id: 'json' as const, label: 'JSON Upload', icon: Database },
              { id: 'manual' as const, label: 'Manual Entry', icon: Plus }
            ]
          ).map(method => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setInputMethod(method.id)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  inputMethod === method.id
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {method.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Import from Inspection */}
      {inspections.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Import From Inspection
          </label>
          <div className="flex space-x-2">
            <select
              value={selectedInspection}
              onChange={(e) => setSelectedInspection(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select inspection</option>
              {inspections.map((insp) => (
                <option key={insp.id} value={insp.id}>
                  {insp.propertyId} - {insp.id}
                </option>
              ))}
            </select>
            <button
              onClick={importFromInspection}
              disabled={!selectedInspection}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedInspection 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Import
            </button>
          </div>
        </div>
      )}

      {/* File Upload */}
      {(inputMethod === 'csv' || inputMethod === 'json') && (
        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload {inputMethod.toUpperCase()} File
            </h3>
            <p className="text-gray-600 mb-4">
              {inputMethod === 'csv' 
                ? 'Upload a CSV file with columns: ItemID, ItemName, Category, CurrentCondition, PurchaseDate, OriginalCost'
                : 'Upload a JSON file with inventory data array'
              }
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={inputMethod === 'csv' ? '.csv' : '.json'}
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose {inputMethod.toUpperCase()} File
              </button>
              <p className="text-xs text-gray-500">
                Max file size: 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {inputMethod === 'manual' && (
        <div className="mb-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID *</label>
              <input
                type="text"
                value={newItem.itemId || ''}
                onChange={(e) => setNewItem({...newItem, itemId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., HVAC-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={newItem.itemName || ''}
                onChange={(e) => setNewItem({...newItem, itemName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Main HVAC Unit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={newItem.category || ''}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                <option value="hvac">HVAC</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="furniture">Furniture</option>
                <option value="appliances">Appliances</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Condition</label>
              <select
                value={newItem.currentCondition || 'Good'}
                onChange={(e) => setNewItem({...newItem, currentCondition: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
                <option value="Non-functional">Non-functional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={newItem.purchaseDate || ''}
                onChange={(e) => setNewItem({...newItem, purchaseDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Cost *</label>
              <input
                type="number"
                value={newItem.originalCost || ''}
                onChange={(e) => setNewItem({...newItem, originalCost: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
              <input
                type="date"
                value={newItem.lastMaintenanceDate || ''}
                onChange={(e) => setNewItem({...newItem, lastMaintenanceDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Market Value</label>
              <input
                type="number"
                value={newItem.currentMarketValue || ''}
                onChange={(e) => setNewItem({...newItem, currentMarketValue: parseFloat(e.target.value) || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newItem.location || ''}
                onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Building A, Floor 2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newItem.description || ''}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Additional details about the item..."
            />
          </div>
          <div className="mt-4">
            <button
              onClick={addManualItem}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Current Inventory Display */}
      {inventoryData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Current Inventory ({inventoryData.length} items)
            </h3>
            <button
              onClick={runAnalysis
              }
              type='button'
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Run Analysis
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryData.map((item) => (
                  <tr key={item.itemId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-500">{item.itemId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.currentCondition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        item.currentCondition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        item.currentCondition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        item.currentCondition === 'Poor' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.currentCondition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.originalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInput;
