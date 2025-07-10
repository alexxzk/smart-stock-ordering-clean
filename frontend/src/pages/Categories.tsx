import { Tag, Plus, Edit, Trash2 } from 'lucide-react'

export default function Categories() {
  const categories = [
    { id: 1, name: 'Appetizers', count: 12, color: 'blue' },
    { id: 2, name: 'Main Course', count: 25, color: 'green' },
    { id: 3, name: 'Desserts', count: 8, color: 'purple' },
    { id: 4, name: 'Beverages', count: 15, color: 'orange' },
    { id: 5, name: 'Sides', count: 10, color: 'yellow' },
  ]

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your menu items into categories</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className={`card border-2 ${getColorClasses(category.color)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Tag className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <p className="text-sm opacity-75">{category.count} items</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-1 hover:bg-white/20 rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-white/20 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-75">Total Products</span>
              <span className="text-2xl font-bold">{category.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
            <p className="text-gray-600">Total Categories</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {categories.reduce((sum, cat) => sum + cat.count, 0)}
            </p>
            <p className="text-gray-600">Total Products</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {(categories.reduce((sum, cat) => sum + cat.count, 0) / categories.length).toFixed(1)}
            </p>
            <p className="text-gray-600">Avg per Category</p>
          </div>
        </div>
      </div>
    </div>
  )
}