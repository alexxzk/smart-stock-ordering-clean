import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  ChefHat,
  Trash2,
  FileText,
  Plus,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface DashboardMetrics {
  todaySales: number
  yesterdaySales: number
  weekSales: number
  monthSales: number
  totalInventoryValue: number
  lowStockItems: number
  expiringItems: number
  activeMenuItems: number
  pendingOrders: number
  wasteValue: number
  topSellingItems: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
  }>
  recentAlerts: Array<{
    id: string
    type: string
    message: string
    priority: 'high' | 'medium' | 'low'
    timestamp: string
  }>
  salesTrend: Array<{
    date: string
    sales: number
  }>
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    fetchDashboardMetrics()
  }, [selectedPeriod])

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true)
      
      // Fetch metrics from multiple APIs
      const [salesMetrics, inventoryReport, menuReport] = await Promise.all([
        fetch('/api/sales-tracking/dashboard', {
          headers: {
            'Authorization': `Bearer ${await currentUser?.getIdToken()}`
          }
        }).then(res => res.json()),
        
        fetch('/api/inventory-management/reports/inventory', {
          headers: {
            'Authorization': `Bearer ${await currentUser?.getIdToken()}`
          }
        }).then(res => res.json()),
        
        fetch('/api/menu-recipe/reports/menu', {
          headers: {
            'Authorization': `Bearer ${await currentUser?.getIdToken()}`
          }
        }).then(res => res.json())
      ])

      // Combine metrics
      const combinedMetrics: DashboardMetrics = {
        todaySales: salesMetrics.metrics?.today_sales || 0,
        yesterdaySales: salesMetrics.metrics?.yesterday_sales || 0,
        weekSales: salesMetrics.metrics?.week_sales || 0,
        monthSales: salesMetrics.metrics?.month_sales || 0,
        totalInventoryValue: inventoryReport.report?.total_value || 0,
        lowStockItems: inventoryReport.report?.low_stock_items || 0,
        expiringItems: inventoryReport.report?.expiring_items || 0,
        activeMenuItems: menuReport.report?.active_items || 0,
        pendingOrders: 3, // Mock data
        wasteValue: 245.50, // Mock data
        topSellingItems: salesMetrics.metrics?.top_selling_items?.slice(0, 5) || [],
        recentAlerts: [
          {
            id: '1',
            type: 'low_stock',
            message: 'Coffee beans running low (2.5kg remaining)',
            priority: 'high',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'expiring',
            message: 'Milk expires in 2 days',
            priority: 'medium',
            timestamp: new Date().toISOString()
          }
        ],
        salesTrend: salesMetrics.metrics?.sales_by_day || []
      }

      setMetrics(combinedMetrics)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, direction: 'neutral' }
    const change = ((current - previous) / previous) * 100
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  const todayChange = getChangeIndicator(metrics?.todaySales || 0, metrics?.yesterdaySales || 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchDashboardMetrics}
              className="btn-primary flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Sales */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics?.todaySales || 0)}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  {todayChange.direction === 'up' && <ArrowUp className="h-4 w-4 text-green-500" />}
                  {todayChange.direction === 'down' && <ArrowDown className="h-4 w-4 text-red-500" />}
                  {todayChange.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-500" />}
                  <span className={`text-sm font-medium ${
                    todayChange.direction === 'up' ? 'text-green-600' :
                    todayChange.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {todayChange.change.toFixed(1)}% vs yesterday
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics?.totalInventoryValue || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {metrics?.lowStockItems || 0} low stock alerts
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Active Menu Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Menu Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.activeMenuItems || 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Active items</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChefHat className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.pendingOrders || 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">Supplier orders</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="h-6 w-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">New Sale</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Package className="h-6 w-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Add Stock</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <ChefHat className="h-6 w-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">New Menu Item</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <ShoppingCart className="h-6 w-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Place Order</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <Trash2 className="h-6 w-6 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-900">Record Waste</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <FileText className="h-6 w-6 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Reports</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {metrics?.recentAlerts?.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1 rounded-full ${
                    alert.priority === 'high' ? 'bg-red-100' :
                    alert.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      alert.priority === 'high' ? 'text-red-600' :
                      alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!metrics?.recentAlerts || metrics.recentAlerts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Items</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {metrics?.topSellingItems?.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(item.revenue)}</p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              ))}
              
              {(!metrics?.topSellingItems || metrics.topSellingItems.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales Trend</h2>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                +{((metrics?.monthSales || 0) / (metrics?.weekSales || 1) * 100 - 100).toFixed(1)}% vs last period
              </span>
            </div>
          </div>
          
          {/* Simple chart representation */}
          <div className="h-64 flex items-end space-x-2">
            {metrics?.salesTrend?.slice(-7).map((data, index) => {
              const maxSales = Math.max(...(metrics?.salesTrend?.map(d => d.sales) || [1]))
              const height = (data.sales / maxSales) * 100
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {new Date(data.date).toLocaleDateString('en-AU', { weekday: 'short' })}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {formatCurrency(data.sales)}
                  </div>
                </div>
              )
            })}
          </div>
          
          {(!metrics?.salesTrend || metrics.salesTrend.length === 0) && (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>No sales trend data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Module Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">View detailed sales reports, trends, and forecasting</p>
            <button className="btn-primary w-full">
              Open Sales Analytics
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Track stock levels, manage products, and view alerts</p>
            <button className="btn-primary w-full">
              Manage Inventory
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChefHat className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Menu & Recipes</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage menu items, recipes, and cost analysis</p>
            <button className="btn-primary w-full">
              Manage Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 