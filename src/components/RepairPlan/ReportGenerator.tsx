import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { FileText, Download, Copy, Check } from 'lucide-react';

interface ReportGeneratorProps {
  analysisResults: AnalysisResult | null;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ analysisResults }) => {
  const [copied, setCopied] = useState(false);

  if (!analysisResults) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
          <p className="text-gray-600">
            Complete inventory analysis to generate detailed remediation reports.
          </p>
        </div>
      </div>
    );
  }

  const generateMarkdownReport = () => {
    const report = `# Property Inventory Remediation Plan

**Generated:** ${new Date(analysisResults.generatedDate).toLocaleDateString()}  
**Total Items Analyzed:** ${analysisResults.totalItems}  
**Items Flagged for Action:** ${analysisResults.flaggedItems.length}  
**Total Estimated Cost:** $${analysisResults.totalEstimatedCost.toLocaleString()}

---

## Executive Summary

This automated remediation plan identifies ${analysisResults.flaggedItems.length} items from a total inventory of ${analysisResults.totalItems} items that require immediate attention. The analysis flagged items based on three key criteria: current physical condition (${analysisResults.summary.conditionFlags} items), lifecycle status (${analysisResults.summary.lifecycleFlags} items), and maintenance requirements (${analysisResults.summary.maintenanceFlags} items).

Based on cost-benefit analysis using a 60% repair-to-value threshold, the system recommends:
- **${analysisResults.itemsToFix.length} items for repair** (estimated cost: $${analysisResults.itemsToFix.reduce((sum, item) => sum + (item.estimatedRepairCost || 0), 0).toLocaleString()})
- **${analysisResults.itemsToReplace.length} items for replacement** (estimated cost: $${analysisResults.itemsToReplace.reduce((sum, item) => sum + (item.estimatedReplacementCost || 0), 0).toLocaleString()})

---

## Project Overview

This comprehensive remediation plan addresses critical asset management needs by providing data-driven recommendations for property inventory maintenance. The automated analysis system evaluates each asset against predefined criteria, ensuring no item is overlooked and all decisions are economically justified.

The implementation of this plan will:
- Prevent minor issues from escalating into costly failures
- Optimize resource allocation through prioritized action items
- Extend the operational lifespan of valuable assets
- Provide clear financial projections for budgeting purposes

---

## Detailed Remediation Plan

### Items Recommended for FIX (${analysisResults.itemsToFix.length} items)

${analysisResults.itemsToFix.map(item => `
#### ${item.itemName} (${item.itemId})

**Current Status:**
- Category: ${item.category}
- Current Condition: ${item.currentCondition}
- Purchase Date: ${new Date(item.purchaseDate).toLocaleDateString()}
- Original Cost: $${item.originalCost.toLocaleString()}

**Justification for Repair:**
${item.flagDetails}

**Recommended Repair Steps:**
${item.repairSteps ? item.repairSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') : 'Detailed repair steps to be determined by qualified technician.'}

**Required Resources:**
${item.requiredResources ? item.requiredResources.map(resource => `- ${resource}`).join('\n') : '- Professional assessment required for specific resource determination'}

**Estimated Timeline:** ${item.estimatedTimeline || 'To be determined based on resource availability'}

**Cost Breakdown:**
- Labor: $${item.costBreakdown?.labor?.toLocaleString() || 'TBD'}
- Parts/Materials: $${item.costBreakdown?.parts?.toLocaleString() || 'TBD'}
- **Total Estimated Cost: $${item.estimatedRepairCost?.toLocaleString() || 'TBD'}**

---
`).join('')}

### Items Recommended for REPLACE (${analysisResults.itemsToReplace.length} items)

${analysisResults.itemsToReplace.map(item => `
#### ${item.itemName} (${item.itemId})

**Current Status:**
- Category: ${item.category}
- Current Condition: ${item.currentCondition}
- Purchase Date: ${new Date(item.purchaseDate).toLocaleDateString()}
- Original Cost: $${item.originalCost.toLocaleString()}

**Justification for Replacement:**
${item.flagDetails}

**Recommended Replacement Process:**
${item.repairSteps ? item.repairSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') : '1. Source equivalent replacement unit\n2. Schedule installation with qualified technician\n3. Coordinate disposal of existing unit\n4. Complete installation and testing'}

**Required Resources:**
${item.requiredResources ? item.requiredResources.map(resource => `- ${resource}`).join('\n') : '- Replacement unit procurement\n- Professional installation services\n- Disposal coordination'}

**Estimated Timeline:** ${item.estimatedTimeline || 'To be determined based on procurement and installation scheduling'}

**Cost Breakdown:**
- New Unit Cost: $${item.costBreakdown?.parts?.toLocaleString() || 'TBD'}
- Installation: $${item.costBreakdown?.installation?.toLocaleString() || 'TBD'}
- Disposal: $${item.costBreakdown?.disposal?.toLocaleString() || 'TBD'}
- **Total Estimated Cost: $${item.estimatedReplacementCost?.toLocaleString() || 'TBD'}**

---
`).join('')}

## Assumptions & Considerations

**IMPORTANT DISCLAIMER:** This remediation plan is generated through automated analysis and provides recommendations based on available data and predefined criteria. All recommendations require human review and validation before implementation.

### Key Assumptions:
- Cost estimates are based on current market rates and may fluctuate
- Labor rates assume qualified technicians appropriate for each item category
- Expected lifespans are derived from industry standards and may vary based on usage and environment
- Repair feasibility assumes standard damage patterns and available replacement parts

### Implementation Considerations:
- Actual costs may vary due to unforeseen complications during repair/replacement
- Timeline estimates depend on resource availability and scheduling constraints
- Some items may require additional assessment before final action determination
- Bulk procurement or scheduling may provide cost advantages

### Next Steps:
1. Review all flagged items and recommendations
2. Validate cost estimates with current supplier quotes
3. Prioritize actions based on criticality and budget constraints
4. Engage qualified contractors for detailed assessments
5. Develop implementation timeline based on operational requirements

---

## Cost Summary

| Category | Items | Estimated Cost |
|----------|-------|----------------|
| Repairs | ${analysisResults.itemsToFix.length} | $${analysisResults.itemsToFix.reduce((sum, item) => sum + (item.estimatedRepairCost || 0), 0).toLocaleString()} |
| Replacements | ${analysisResults.itemsToReplace.length} | $${analysisResults.itemsToReplace.reduce((sum, item) => sum + (item.estimatedReplacementCost || 0), 0).toLocaleString()} |
| **TOTAL** | **${analysisResults.flaggedItems.length}** | **$${analysisResults.totalEstimatedCost.toLocaleString()}** |

---

*Report generated by Property Inventory Remediation Application on ${new Date().toLocaleString()}*
`;

    return report;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadReport = () => {
    const report = generateMarkdownReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-remediation-plan-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Remediation Report</h2>
        <p className="text-gray-600">
          Generate a comprehensive Markdown report with detailed remediation plans and cost analysis.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={copyToClipboard}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        
        <button
          onClick={downloadReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </button>
      </div>

      {/* Report Preview */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Report Preview</h3>
        </div>
        <div className="p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono max-h-96 overflow-y-auto">
            {generateMarkdownReport()}
          </pre>
        </div>
      </div>

      {/* Report Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Report Sections</h4>
          <p className="text-2xl font-bold text-blue-900">6</p>
          <p className="text-xs text-blue-600">Executive Summary, Project Overview, Detailed Plans, etc.</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-1">Items Documented</h4>
          <p className="text-2xl font-bold text-green-900">{analysisResults.flaggedItems.length}</p>
          <p className="text-xs text-green-600">With detailed remediation plans</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="text-sm font-medium text-purple-800 mb-1">Estimated Word Count</h4>
          <p className="text-2xl font-bold text-purple-900">{generateMarkdownReport().split(' ').length}</p>
          <p className="text-xs text-purple-600">Comprehensive documentation</p>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;