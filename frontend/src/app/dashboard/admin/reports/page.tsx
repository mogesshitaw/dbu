export default function SystemReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Reports</h1>
        <p className="text-gray-600">View and analyze system reports</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">User Activity</h3>
            <p className="text-sm text-gray-600 mt-2">View user login and activity reports</p>
            <button className="mt-3 text-blue-600 text-sm hover:text-blue-800">
              Generate Report →
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">System Performance</h3>
            <p className="text-sm text-gray-600 mt-2">Monitor system performance metrics</p>
            <button className="mt-3 text-blue-600 text-sm hover:text-blue-800">
              Generate Report →
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">Security Logs</h3>
            <p className="text-sm text-gray-600 mt-2">Review security and access logs</p>
            <button className="mt-3 text-blue-600 text-sm hover:text-blue-800">
              Generate Report →
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Generate All Reports
          </button>
        </div>
      </div>
    </div>
  );
}