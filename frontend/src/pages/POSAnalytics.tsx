import { BarChart3, TrendingUp, DollarSign, Clock } from 'lucide-react'

export default function POSAnalytics() {
  const analyticsData = {
    dailySales: 2845.50,
    dailyTransactions: 127,
    avgOrderValue: 22.41,
    peakHour: '7:00 PM'
  }

  const topSellingItems = [
    { name: 'Margherita Pizza', sales: 45, revenue: 584.55 },
    { name: 'Caesar Salad', sales: 38, revenue: 341.62 },
    { name: 'Pasta Carbonara', sales: 32, revenue: 479.68 },
    { name: 'House Wine', sales: 28, revenue: 336.00 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">POS Analytics</h1>
        <p className="text-gray-600">Analyze your point-of-sale data and sales performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${analyticsData.dailySales.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.dailyTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${analyticsData.avgOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Peak Hour</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.peakHour}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items Today</h3>
        <div className="space-y-3">
          {topSellingItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.sales} orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${item.revenue.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Sales chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}