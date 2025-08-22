import React from 'react';
import { SystemConfig } from '../../types';
import { Settings, DollarSign, Clock, Wrench } from 'lucide-react';

interface SystemSettingsProps {
  config: SystemConfig;
  setConfig: (config: SystemConfig) => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ config, setConfig }) => {
  const updateConfig = (section: keyof SystemConfig, key: string, value: number) => {
    const currentSection = config[section];
    if (typeof currentSection === 'object' && currentSection !== null) {
      setConfig({
        ...config,
        [section]: {
          ...currentSection as Record<string, number>,
          [key]: value
        }
      });
    }
  };

  const updateRepairThreshold = (value: number) => {
    setConfig({
      ...config,
      repairThreshold: value
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
        <p className="text-gray-600">
          Configure analysis parameters, labor rates, and lifecycle thresholds.
        </p>
      </div>

      <div className="space-y-8">
        {/* Repair Threshold */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Wrench className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Repair vs Replace Threshold</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Items are recommended for replacement when repair cost exceeds this percentage of their value.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={config.repairThreshold}
              onChange={(e) => updateRepairThreshold(parseFloat(e.target.value))}
              className="flex-1"
            />
            <div className="text-lg font-semibold text-blue-600 min-w-[60px]">
              {(config.repairThreshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Labor Rates */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Labor Rates (per hour)</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Set hourly labor rates for different categories of work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(config.laborRates).map(([category, rate]) => (
              <div key={category}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {category}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => updateConfig('laborRates', category, parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Thresholds */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Thresholds (months)</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Flag items when maintenance is overdue by these time periods.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(config.maintenanceThresholds).map(([category, threshold]) => (
              <div key={category}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {category}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => updateConfig('maintenanceThresholds', category, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Lifespans */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Expected Lifespans (months)</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Define expected operational lifespans for different categories of items.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(config.expectedLifespans).map(([category, lifespan]) => (
              <div key={category}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {category}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={lifespan}
                    onChange={(e) => updateConfig('expectedLifespans', category, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Settings are automatically saved and will be applied to future analysis runs. 
            Re-run analysis on existing data to apply new settings to current results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;