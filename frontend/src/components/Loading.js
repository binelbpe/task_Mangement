export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl animate-scale">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-gray-900">Loading...</div>
        </div>
      </div>
    </div>
  );
} 