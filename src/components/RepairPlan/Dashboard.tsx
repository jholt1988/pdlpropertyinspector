import React from 'react';
import { InventoryItem, AnalysisResult } from '../../types';
import { Package, AlertTriangle, Wrench, RefreshCw, DollarSign, Calendar } from 'lucide-react';

interface DashboardProps {
  inventoryData: InventoryItem[];
  analysisResults: AnalysisResult | null;
}

const Dashboard: React.FC<DashboardProps> = ({ inventoryData, analysisResults }) => {
  const stats = [
    {
      label: 'Total Inventory Items',
      value: inventoryData.length,
      icon: Package,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Flagged Items',
      value: analysisResults?.flaggedItems.length || 0,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      label: 'Items to Fix',
      value: analysisResults?.itemsToFix.length || 0,
      icon: Wrench,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      label: 'Items to Replace',
      value: analysisResults?.itemsToReplace.length || 0,
      icon: RefreshCw,
      color: 'bg-red-50 text-red-600'
    }
  ];

  const conditionDistribution = inventoryData.reduce((acc, item) => {
    acc[item.currentCondition] = (acc[item.currentCondition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">
          Monitor your property inventory health and remediation status at a glance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cost Summary */}
      {analysisResults && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Estimated Remediation Cost</h3>
              <p className="text-sm text-gray-600">
                Based on analysis completed on {new Date(analysisResults.generatedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                ${analysisResults.totalEstimatedCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condition Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Condition Distribution</h3>
          <div className="space-y-3">
            {Object.entries(conditionDistribution).map(([condition, count]) => {
              const percentage = inventoryData.length > 0 ? (count / inventoryData.length) * 100 : 0;
              const colorMap: Record<string, string> = {
                'Excellent': 'bg-green-500',
                'Good': 'bg-blue-500',
                'Fair': 'bg-yellow-500',
                'Poor': 'bg-orange-500',
                'Damaged': 'bg-red-500',
                'Non-functional': 'bg-gray-500'
              };
              
              return (
                <div key={condition}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{condition}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colorMap[condition] || 'bg-gray-400'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analysis Summary */}
        {analysisResults && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Condition-based Flags</span>
                <span className="font-semibold text-amber-600">{analysisResults.summary.conditionFlags}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Lifecycle-based Flags</span>
                <span className="font-semibold text-blue-600">{analysisResults.summary.lifecycleFlags}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Maintenance-based Flags</span>
                <span className="font-semibold text-purple-600">{analysisResults.summary.maintenanceFlags}</span>
              </div>
              <div className="pt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last analysis: {new Date(analysisResults.generatedDate).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {inventoryData.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Data</h3>
          <p className="text-gray-600 mb-4">Get started by importing your inventory data.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Import Data
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;