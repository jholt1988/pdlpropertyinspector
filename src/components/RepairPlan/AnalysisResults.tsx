import React, { useState } from 'react';
import { AnalysisResult, FlaggedItem } from '../../types';
import { AlertTriangle, Wrench, RefreshCw, DollarSign } from 'lucide-react';

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
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                  <span className="text-sm text-gray-500">({item.itemId})</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFlagReasonColor(item.flagReason)}`}>
                    {item.flagReason}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(item.recommendation)}`}>
                    {item.recommendation.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{item.flagDetails}</p>
                
                {/* Cost Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Fix Option */}
                  <div className={`border rounded-lg p-4 ${item.recommendation === 'fix' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Fix Option</h4>
                      {item.recommendation === 'fix' && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">RECOMMENDED</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">${item.costBreakdown?.labor?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts:</span>
                        <span className="font-medium">${item.costBreakdown?.parts?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-green-600">${item.estimatedRepairCost?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Replace Option */}
                  <div className={`border rounded-lg p-4 ${item.recommendation === 'replace' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Replace Option</h4>
                      {item.recommendation === 'replace' && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">RECOMMENDED</span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">${item.costBreakdown?.installation?.toLocaleString() || 'Est.'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Unit:</span>
                        <span className="font-medium">${(item.originalCost * 0.8)?.toLocaleString() || 'Est.'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-2">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-orange-600">${item.estimatedReplacementCost?.toLocaleString() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 font-medium capitalize">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Condition:</span>
                    <span className="ml-1 font-medium">{item.currentCondition}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-1 font-medium">{item.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeline:</span>
                    <span className="ml-1 font-medium">{item.estimatedTimeline || '1-2 weeks'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-6">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  ${(item.recommendation === 'fix' ? item.estimatedRepairCost : item.estimatedReplacementCost)?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {item.recommendation === 'fix' ? 'Fix Cost' : 'Replace Cost'}
                </div>
                {item.estimatedRepairCost && item.estimatedReplacementCost && (
                  <div className="text-xs text-green-600 mt-1">
                    Saves ${Math.abs((item.estimatedReplacementCost || 0) - (item.estimatedRepairCost || 0)).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedItem.itemName}</h2>
                  <p className="text-gray-600">{selectedItem.itemId} • {selectedItem.location || 'Location not specified'}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFlagReasonColor(selectedItem.flagReason)}`}>
                      {selectedItem.flagReason}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(selectedItem.recommendation)}`}>
                      {selectedItem.recommendation.toUpperCase()} RECOMMENDED
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Item Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Item Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">{selectedItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Condition:</span>
                        <span className={`font-medium ${
                          selectedItem.currentCondition === 'Poor' || selectedItem.currentCondition === 'Damaged' || selectedItem.currentCondition === 'Non-functional' 
                            ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {selectedItem.currentCondition}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Date:</span>
                        <span className="font-medium">{new Date(selectedItem.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Cost:</span>
                        <span className="font-medium">${selectedItem.originalCost.toLocaleString()}</span>
                      </div>
                      {selectedItem.currentMarketValue && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Market Value:</span>
                          <span className="font-medium">${selectedItem.currentMarketValue.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedItem.description && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-600 block mb-1">Description:</span>
                          <p className="text-sm">{selectedItem.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Details</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2"><strong>Flag Reason:</strong> {selectedItem.flagReason}</p>
                      <p className="text-sm text-gray-700">{selectedItem.flagDetails}</p>
                    </div>
                  </div>

                  {/* Cost Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Analysis</h3>
                    <div className="space-y-4">
                      {/* Fix Option */}
                      <div className={`border rounded-lg p-4 ${selectedItem.recommendation === 'fix' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Repair Option</h4>
                          {selectedItem.recommendation === 'fix' && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">RECOMMENDED</span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Labor Cost:</span>
                            <span className="font-medium">${selectedItem.costBreakdown?.labor?.toLocaleString() || 'TBD'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Parts/Materials:</span>
                            <span className="font-medium">${selectedItem.costBreakdown?.parts?.toLocaleString() || 'TBD'}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-semibold">Total Repair Cost:</span>
                            <span className="font-bold text-green-600">${selectedItem.estimatedRepairCost?.toLocaleString() || 'TBD'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Replace Option */}
                      <div className={`border rounded-lg p-4 ${selectedItem.recommendation === 'replace' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Replacement Option</h4>
                          {selectedItem.recommendation === 'replace' && (
                            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">RECOMMENDED</span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Installation Labor:</span>
                            <span className="font-medium">${selectedItem.costBreakdown?.installation?.toLocaleString() || 'Est.'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">New Unit Cost:</span>
                            <span className="font-medium">${(selectedItem.originalCost * 0.8).toLocaleString()}</span>
                          </div>
                          {selectedItem.costBreakdown?.disposal && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Disposal:</span>
                              <span className="font-medium">${selectedItem.costBreakdown.disposal.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-semibold">Total Replacement Cost:</span>
                            <span className="font-bold text-orange-600">${selectedItem.estimatedReplacementCost?.toLocaleString() || 'TBD'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cost Savings */}
                      {selectedItem.estimatedRepairCost && selectedItem.estimatedReplacementCost && (
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-800">
                              {selectedItem.recommendation === 'fix' ? 'Savings by Repairing:' : 'Additional Cost to Replace:'}
                            </span>
                            <span className="font-bold text-green-800">
                              ${Math.abs(selectedItem.estimatedReplacementCost - selectedItem.estimatedRepairCost).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Recommended Instructions */}
                  {selectedItem.repairSteps && selectedItem.repairSteps.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {selectedItem.recommendation === 'fix' ? 'Repair Instructions' : 'Replacement Instructions'}
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <ol className="space-y-2">
                          {selectedItem.repairSteps.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mr-3 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Required Resources */}
                  {selectedItem.requiredResources && selectedItem.requiredResources.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Resources</h3>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <ul className="space-y-1">
                          {selectedItem.requiredResources.map((resource, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-yellow-600 mr-2">•</span>
                              <span className="text-sm text-gray-700">{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Timeline & Additional Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Timeline</h3>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-600 font-medium">Estimated Duration:</span>
                        <span className="font-semibold">{selectedItem.estimatedTimeline || '1-2 weeks'}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Timeline may vary based on parts availability and contractor scheduling.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Request Quote from Contractor
                    </button>
                    <button className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                      Add to Project Plan
                    </button>
                  </div>
                </div>
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