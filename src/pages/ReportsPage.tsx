import { FileText } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">0 reports available</p>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="card text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600 mb-6">Complete some inspections to generate reports</p>
        </div>
      </div>
    </div>
  );
}