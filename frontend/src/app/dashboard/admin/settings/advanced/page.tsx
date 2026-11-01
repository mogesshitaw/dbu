export default function AdvancedSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advanced Settings</h1>
        <p className="text-gray-600">Configure advanced system settings</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">API Configuration</label>
            <textarea 
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter API configuration"
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              <span className="ml-2 text-sm text-gray-700">Enable Debug Mode</span>
            </label>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save Advanced Settings
          </button>
        </div>
      </div>
    </div>
  );
}