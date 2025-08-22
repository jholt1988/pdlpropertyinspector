// components/RepairPlan/EnhancedDataInput.tsx
import React, { useState, useRef } from 'react';
import { Upload, Plus, FileText, Database, Trash2, Calculator } from 'lucide-react';
import { InventoryItem, AnalysisResult, Inspection, UserLocation } from '../../types';
import { generateEnhancedRepairEstimate, EnhancedDetailedEstimate } from '../../services/enhancedEstimate';
import { useStorage } from '../../contexts/StorageContext';
import { inspectionToInventoryItems } from '../../utils/inspectionConverter';
import { createAnalysisResultFromEstimateResult, createFallbackAnalysisResult } from '../../utils/dataNormalization';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ToastContainer';

interface EnhancedDataInputProps {
  inventoryData: InventoryItem[];
  setInventoryData: (data: InventoryItem[]) => void;
  setAnalysisResults: (results: AnalysisResult) => void;
  setEnhancedResults?: (results: EnhancedDetailedEstimate) => void;
  onInspectionImported?: (inspection: Inspection) => void;
  userLocation?: UserLocation;
}

const EnhancedDataInput: React.FC<EnhancedDataInputProps> = ({
  inventoryData,
  setInventoryData,
  setAnalysisResults,
  setEnhancedResults,
  onInspectionImported,
  userLocation = { city: 'Wichita', region: 'Kansas', country: 'US', type: 'approximate' }
}) => {
  const [inputMethod, setInputMethod] = useState<'csv' | 'json' | 'manual'>('csv');
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    currentCondition: 'Good'
  });
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inspections } = useStorage();
  const [selectedInspection, setSelectedInspection] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const { toasts, showToast, removeToast, showAnalysisStarted, showAnalysisCompleted } = useToast();

  const generateEnhancedEstimate = async () => {
    if (inventoryData.length === 0) {
      showToast('No inventory data available for analysis', 'warning');
      return;
    }

    setIsGeneratingEstimate(true);
    setError(null);

    try {
      // Show progress toast
      const progressToastId = showAnalysisStarted();

      // Generate enhanced estimate with depreciation calculations
      const enhancedEstimate = await generateEnhancedRepairEstimate(
        inventoryData,
        userLocation,
        'USD',
        (step: string) => {
          console.log('Progress:', step);
        }
      );

      // Remove progress toast and show completion
      removeToast(progressToastId);
      showAnalysisCompleted();

      // Update results
      if (setEnhancedResults) {
        setEnhancedResults(enhancedEstimate);
      }

      // Convert to legacy format for compatibility
      const legacyAnalysisResult = convertToLegacyFormat(enhancedEstimate);
      setAnalysisResults(legacyAnalysisResult);

      showToast(
        `Enhanced analysis complete! Processed ${inventoryData.length} items with ${enhancedEstimate.summary.reclassifiedItems} reclassifications.`,
        'success'
      );

    } catch (error) {
      console.error('Enhanced estimate generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate enhanced estimate');
      showToast('Failed to generate enhanced estimate. Please try again.', 'error');
    } finally {
      setIsGeneratingEstimate(false);
    }
  };

  const convertToLegacyFormat = (enhanced: EnhancedDetailedEstimate): AnalysisResult => {
    const flaggedItems = enhanced.line_items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      category: item.category,
      currentCondition: item.currentCondition as any,
      purchaseDate: new Date().toISOString(),
      originalCost: item.originalCost,
      location: item.location,
      flagReason: 'condition' as const,
      flagDetails: item.reclassificationReason || `Condition-based analysis with ${(item.conditionPenalty * 100).toFixed(0)}% penalty`,
      recommendation: item.recommendedAction.toLowerCase() as 'fix' | 'replace',
      estimatedRepairCost: item.fix?.totalCost,
      estimatedReplacementCost: item.replace?.totalCost,
      repairSteps: item.instructions?.fix || item.instructions?.replace,
      costBreakdown: {
        labor: item.recommendedAction === 'Fix' ? 
          (item.fix?.laborHours || 0) * (item.fix?.laborRate || 0) :
          (item.replace?.laborHours || 0) * (item.replace?.laborRate || 0),
        parts: item.recommendedAction === 'Fix' ? item.fix?.partsCost : item.replace?.partsCost
      }
    }));

    return {
      totalItems: enhanced.line_items.length,
      flaggedItems,
      itemsToFix: flaggedItems.filter(item => item.recommendation === 'fix'),
      itemsToReplace: flaggedItems.filter(item => item.recommendation === 'replace'),
      totalEstimatedCost: enhanced.summary.totalRecommendedCost,
      generatedDate: enhanced.metadata.generated_date,
      summary: {
        conditionFlags: flaggedItems.length,
        lifecycleFlags: 0,
        maintenanceFlags: 0
      }
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        if (inputMethod === 'csv') {
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const item: any = {};
            headers.forEach((header, index) => {
              const key = header.toLowerCase().replace(/\s+/g, '');
              let value: any = values[index] || '';
              
              if (key === 'originalcost' || key === 'currentmarketvalue') {
                value = parseFloat(value) || 0;
              }
              
              item[key] = value;
            });
            
            return {
              itemId: item.itemid || `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              itemName: item.itemname || 'Unknown Item',
              category: item.category || 'general',
              currentCondition: item.currentcondition || 'Good',
              purchaseDate: item.purchasedate || new Date().toISOString(),
              originalCost: item.originalcost || 0,
              currentMarketValue: item.currentmarketvalue,
              location: item.location || 'Unknown',
              description: item.description || '',
              lastMaintenanceDate: item.lastmaintenancedate
            } as InventoryItem;
          });
          
          setInventoryData(data);
          showToast(`Successfully imported ${data.length} items from CSV`, 'success');
        } else if (inputMethod === 'json') {
          const data = JSON.parse(content);
          setInventoryData(Array.isArray(data) ? data : [data]);
          showToast(`Successfully imported ${Array.isArray(data) ? data.length : 1} items from JSON`, 'success');
        }
        setError(null);
      } catch (err) {
        const errorMessage = `Error parsing ${inputMethod.toUpperCase()} file: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    };
    
    reader.readAsText(file);
  };

  const addManualItem = () => {
    if (!newItem.itemName || !newItem.category) {
      showToast('Please fill in required fields (Item Name and Category)', 'warning');
      return;
    }

    const item: InventoryItem = {
      itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemName: newItem.itemName!,
      category: newItem.category!,
      currentCondition: newItem.currentCondition as any || 'Good',
      purchaseDate: newItem.purchaseDate || new Date().toISOString(),
      originalCost: newItem.originalCost || 0,
      currentMarketValue: newItem.currentMarketValue,
      location: newItem.location || 'Unknown',
      description: newItem.description || '',
      lastMaintenanceDate: newItem.lastMaintenanceDate
    };

    setInventoryData([...inventoryData, item]);
    setNewItem({ currentCondition: 'Good' });
    showToast('Item added successfully', 'success');
  };

  const importFromInspection = () => {
    if (!selectedInspection) {
      showToast('Please select an inspection to import', 'warning');
      return;
    }

    const inspection = inspections.find(insp => insp.id === selectedInspection);
    if (!inspection) {
      showToast('Selected inspection not found', 'error');
      return;
    }

    try {
      const convertedItems = inspectionToInventoryItems(inspection);
      setInventoryData(convertedItems);
      if (onInspectionImported) {
        onInspectionImported(inspection);
      }
      showToast(`Imported ${convertedItems.length} items from inspection`, 'success');
    } catch (err) {
      const errorMessage = `Error importing inspection: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const removeItem = (index: number) => {
    const newData = inventoryData.filter((_, i) => i !== index);
    setInventoryData(newData);
    showToast('Item removed', 'info');
  };

  const clearAllData = () => {
    setInventoryData([]);
    setError(null);
    showToast('All data cleared', 'info');
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Inventory Data Input</h2>
          <p className="text-gray-600">
            Import or manually enter inventory data for enhanced depreciation analysis and cost estimation.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Input Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Input Method</label>
          <div className="flex space-x-4">
            {(['csv', 'json', 'manual'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setInputMethod(method)}
                className={`px-4 py-2 rounded-md border ${
                  inputMethod === method
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {method.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        {(inputMethod === 'csv' || inputMethod === 'json') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload {inputMethod.toUpperCase()} File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept={inputMethod === 'csv' ? '.csv' : '.json'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Click to upload or drag and drop your {inputMethod.toUpperCase()} file
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Input Form */}
        {inputMethod === 'manual' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.itemName || ''}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HVAC Unit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={newItem.category || ''}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="flooring">Flooring</option>
                  <option value="locksmith">Locksmith</option>
                  <option value="painter">Painter</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="roofing">Roofing</option>
                  <option value="fencing">Fencing</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="pest control">Pest Control</option>
                  <option value="foundation">Foundation</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Condition</label>
                <select
                  value={newItem.currentCondition || 'Good'}
                  onChange={(e) => setNewItem({ ...newItem, currentCondition: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Cost</label>
                <input
                  type="number"
                  value={newItem.originalCost || ''}
                  onChange={(e) => setNewItem({ ...newItem, originalCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={newItem.purchaseDate?.split('T')[0] || ''}
                  onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newItem.location || ''}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Roof, Basement"
                />
              </div>
            </div>
            <button
              onClick={addManualItem}
              className="mt-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        )}

        {/* Import from Inspection */}
        {inspections.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Import from Inspection</h3>
            <div className="flex items-center space-x-4">
              <select
                value={selectedInspection}
                onChange={(e) => setSelectedInspection(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an inspection</option>
                {inspections.map((inspection) => (
                  <option key={inspection.id} value={inspection.id}>
                    {inspection.propertyId} - {new Date(inspection.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                onClick={importFromInspection}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Import
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Estimate Generation */}
        {inventoryData.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enhanced Analysis & Estimation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate comprehensive estimates using the 6-step enhanced process with depreciation calculations, 
              condition adjustments, and trade-specific analysis.
            </p>
            <button
              onClick={generateEnhancedEstimate}
              disabled={isGeneratingEstimate}
              className={`flex items-center px-6 py-3 rounded-md text-white font-medium ${
                isGeneratingEstimate 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Calculator className="h-5 w-5 mr-2" />
              {isGeneratingEstimate ? 'Generating Enhanced Estimate...' : 'Generate Enhanced Estimate'}
            </button>
          </div>
        )}

        {/* Current Data Summary */}
        {inventoryData.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Current Inventory ({inventoryData.length} items)
              </h3>
              <button
                onClick={clearAllData}
                className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryData.map((item, index) => (
                    <tr key={item.itemId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.currentCondition === 'Excellent' ? 'bg-green-100 text-green-800' :
                          item.currentCondition === 'Good' ? 'bg-blue-100 text-blue-800' :
                          item.currentCondition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.currentCondition}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${item.originalCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
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
    </>
  );
};

export default EnhancedDataInput;