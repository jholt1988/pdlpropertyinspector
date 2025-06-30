import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Report Details</h1>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="card">
          <p className="text-gray-600">Report ID: {id}</p>
          <p className="text-gray-600 mt-2">Report details will be implemented here.</p>
        </div>
      </div>
    </div>
  );
}