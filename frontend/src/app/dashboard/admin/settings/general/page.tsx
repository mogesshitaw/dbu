export default function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-gray-600">Manage your general application settings</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Application Name</label>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter application name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option>UTC</option>
              <option>EST</option>
              <option>PST</option>
            </select>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}