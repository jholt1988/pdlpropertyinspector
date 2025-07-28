import React, { useState } from 'react';
import { AnalysisResult, FlaggedItem } from '../../types';
import { AlertTriangle, Wrench, RefreshCw, DollarSign, Clock, MapPin, Info } from 'lucide-react';

interface AnalysisResultsProps {
  analysisResults: AnalysisResult | null;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysisResults }) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'fix' | 'replace'>('all');
  const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
  console.log('Analysis Results:', analysisResults);
  if (!analysisResults) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
          <p className="text-gray-600">
            Import inventory data and run analysis to see results here.
          </p>
        </div>
      </div>
    );
  }

  const getDisplayItems = () => {
    switch (selectedTab) {
      case 'fix':
        return analysisResults.itemsToFix;
      case 'replace':
        return analysisResults.itemsToReplace;
      default:
        return analysisResults.flaggedItems;
    }
  };

  const getFlagReasonColor = (reason: string) => {
    switch (reason) {
      case 'condition': return 'bg-red-100 text-red-800';
      case 'lifecycle': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    return recommendation === 'fix' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Results</h2>
        <p className="text-gray-600 mb-4">
          Review flagged items and recommended actions based on condition and lifecycle analysis.
        </p>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Analyzed</p>
                <p className="text-2xl font-bold text-blue-900">{analysisResults.totalItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Flagged Items</p>
                <p className="text-2xl font-bold text-amber-900">{analysisResults.flaggedItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Items to Fix</p>
                <p className="text-2xl font-bold text-green-900">{analysisResults.itemsToFix.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Items to Replace</p>
                <p className="text-2xl font-bold text-red-900">{analysisResults.itemsToReplace.length}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Estimated Cost</h3>
              <p className="text-sm text-gray-600">
                Analysis completed on {new Date(analysisResults.generatedDate).toLocaleDateString()}
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
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Flagged Items', count: analysisResults.flaggedItems.length },
            { id: 'fix', label: 'Items to Fix', count: analysisResults.itemsToFix.length },
            { id: 'replace', label: 'Items to Replace', count: analysisResults.itemsToReplace.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {getDisplayItems().map((item) => (
          <div
            key={item.itemId}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                  <span className="text-sm text-gray-500">({item.itemId})</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFlagReasonColor(item.flagReason)}`}>
                    {item.flagReason}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(item.recommendation)}`}>
                    {item.recommendation.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{item.flagDetails}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 font-medium capitalize">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <span className="ml-1 font-medium">{item.currentCondition}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Purchase Date:</span>
                    <span className="ml-1 font-medium">{new Date(item.purchaseDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Original Cost:</span>
                    <span className="ml-1 font-medium">${item.originalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  ${(item.recommendation === 'fix' ? item.estimatedRepairCost : item.estimatedReplacementCost)?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">{item.estimatedTimeline}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.itemName}</h2>
                  <p className="text-gray-600">{selectedItem.itemId}</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Item Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium capitalize">{selectedItem.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Condition:</span>
                      <span className="ml-2 font-medium">{selectedItem.currentCondition}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Purchase Date:</span>
                      <span className="ml-2 font-medium">{new Date(selectedItem.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Original Cost:</span>
                      <span className="ml-2 font-medium">${selectedItem.originalCost.toLocaleString()}</span>
                    </div>
                    {selectedItem.location && (
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 font-medium">{selectedItem.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flag Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Flag Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFlagReasonColor(selectedItem.flagReason)}`}>
                        {selectedItem.flagReason}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(selectedItem.recommendation)}`}>
                        {selectedItem.recommendation.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700">{selectedItem.flagDetails}</p>
                  </div>
                </div>

                {/* Repair Steps */}
                {selectedItem.repairSteps && selectedItem.repairSteps.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedItem.recommendation === 'fix' ? 'Recommended Repair Steps' : 'Replacement Process'}
                    </h3>
                    <ul className="space-y-2">
                      {selectedItem.repairSteps.map((step, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Resources */}
                {selectedItem.requiredResources && selectedItem.requiredResources.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Resources</h3>
                    <ul className="space-y-1">
                      {selectedItem.requiredResources.map((resource, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          <span className="text-gray-700">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cost Breakdown */}
                {selectedItem.costBreakdown && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {selectedItem.costBreakdown.labor && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Labor:</span>
                            <span className="font-medium">${selectedItem.costBreakdown.labor.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedItem.costBreakdown.parts && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Parts/Materials:</span>
                            <span className="font-medium">${selectedItem.costBreakdown.parts.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedItem.costBreakdown.disposal && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Disposal:</span>
                            <span className="font-medium">${selectedItem.costBreakdown.disposal.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedItem.costBreakdown.installation && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Installation:</span>
                            <span className="font-medium">${selectedItem.costBreakdown.installation.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="border-t border-green-200 pt-2 mt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-green-600">
                              ${(selectedItem.recommendation === 'fix' ? selectedItem.estimatedRepairCost : selectedItem.estimatedReplacementCost)?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {selectedItem.estimatedTimeline && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Estimated Timeline</h3>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="h-5 w-5" />
                      <span>{selectedItem.estimatedTimeline}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisResults.flaggedItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-green-600 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Items in Good Condition</h3>
          <p className="text-gray-600">
            No items were flagged for repair or replacement based on the analysis criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;