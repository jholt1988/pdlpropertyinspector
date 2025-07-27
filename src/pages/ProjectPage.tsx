import React, { useState } from 'react';
import { FileSpreadsheet, Database, FileText, Settings, Home, BarChart3 } from 'lucide-react';
import Dashboard from '../components/RepairPlan/Dashboard';
import DataInput from '../components/RepairPlan/DataInput';
import AnalysisResults from '../components/RepairPlan/AnalysisResults';
import ReportGenerator from '../components/RepairPlan/ReportGenerator';
import SystemSettings from '../components/RepairPlan/SystemSettings';
import { InventoryItem, AnalysisResult, SystemConfig, Inspection, RepairPlan } from '../types';
import { useStorage } from '../contexts/StorageContext';
import { generateUniqueId } from '../utils/idGenerator';
import {PropertyRepairEstimatorAgent} from 'key-check-agent';
import { OpenAI } from 'openai';
import{ setDefaultOpenAIKey, setDefaultOpenAIClient } from '@openai/agents';


function ProjectPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'analysis' | 'report' | 'settings'>('dashboard');
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const { saveRepairPlan } = useStorage();
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    repairThreshold: 0.6,
    laborRates: {
      general: 75,
      electrical: 95,
      plumbing: 85,
      hvac: 90,
      specialized: 120
    },
    maintenanceThresholds: {
      electrical: 12, // months
      plumbing: 18,
      hvac: 6,
      general: 24
    },
    expectedLifespans: {
      electrical: 120, // months
      plumbing: 300,
      hvac: 180,
      furniture: 120,
      appliances: 144,
      general: 60
    }
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
    setDefaultOpenAIClient(openai);


  const handleSavePlan = async () => {
    if (!analysisResults) {
      alert('Run analysis before saving the plan');
      return;
    }
    const agent = await PropertyRepairEstimatorAgent(inventoryData, analysisResults, "US");
    console.log("Running Property Repair Estimator Agent...");
    console.log((await agent).overall_project_estimate)
    const plan: RepairPlan = {
      id: generateUniqueId('plan_'),
      propertyId: currentInspection?.propertyId || 'unknown',
      unitNumber: currentInspection?.unitNumber,
      inspectionId: currentInspection?.id,
      inventoryData,
      analysisResults,
      createdAt: new Date().toISOString(),
    };
    await saveRepairPlan(plan);
    alert('Repair plan saved');
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'input', label: 'Data Input', icon: Database },
    { id: 'analysis', label: 'Analysis Results', icon: BarChart3 },
    { id: 'report', label: 'Generate Report', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventoryData={inventoryData} analysisResults={analysisResults} />;
      case 'input':
        return <DataInput
          inventoryData={inventoryData}
          setInventoryData={setInventoryData}
          setAnalysisResults={setAnalysisResults}
          systemConfig={systemConfig}
          onInspectionImported={setCurrentInspection}
        />;
      case 'analysis':
        return <AnalysisResults analysisResults={analysisResults} />;
      case 'report':
        return <ReportGenerator analysisResults={analysisResults} onSavePlan={handleSavePlan} />;
      case 'settings':
        return <SystemSettings config={systemConfig} setConfig={setSystemConfig} />;
      default:
        return <Dashboard inventoryData={inventoryData} analysisResults={analysisResults} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Property Inventory Remediation</h1>
            </div>
            <div className="text-sm text-gray-500">
              {inventoryData.length > 0 && `${inventoryData.length} items loaded`}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 space-y-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProjectPage;
