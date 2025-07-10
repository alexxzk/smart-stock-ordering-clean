import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function RestaurantInventory() {
  const inventoryItems = [
    { name: 'Tomatoes', current: 25, min: 10, unit: 'kg', status: 'good' },
    { name: 'Olive Oil', current: 5, min: 8, unit: 'L', status: 'low' },
    { name: 'Pasta', current: 15, min: 5, unit: 'kg', status: 'good' },
    { name: 'Cheese', current: 2, min: 3, unit: 'kg', status: 'critical' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'low':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'low':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Inventory</h1>
        <p className="text-gray-600">Manage your restaurant's ingredient and supply inventory</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{inventoryItems.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Good Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'good').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'low').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Inventory</h3>
        <div className="space-y-3">
          {inventoryItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Min: {item.min} {item.unit}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{item.current} {item.unit}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}