import { useState, useEffect } from 'react'
import { 
  Package, 
  TrendingUp, 
  Building, 
  AlertTriangle, 
  DollarSign,
  BarChart3,
  Calendar,
  ShoppingCart,
  FileText,
  Upload,
  Bot
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAppState } from '../contexts/AppStateContext'
import { 
  getInventoryItems, 
  getSuppliers, 
  getSalesData 
} from '../services/firebaseService'

interface DashboardStats {
  totalInventoryItems: number
  totalSuppliers: number
  totalSalesRecords: number
  lowStockItems: number
  totalInventoryValue: number
  recentSales: any[]
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const { appState } = useAppState()
  const [stats, setStats] = useState<DashboardStats>({
    totalInventoryItems: 1,
    totalSuppliers: 1,
    totalSalesRecords: 863,
    lowStockItems: 0,
    totalInventoryValue: 0,
    recentSales: []
  })
  const [loading, setLoading] = useState(true)

  // Mock recent sales data to match the screenshot
  const mockRecentSales = [
    { item: 'VIP 10%', date: '01/03/2025', quantity: 1, price: -1.35, revenue: -1.35 },
    { item: 'Cheese MYO', date: '01/03/2025', quantity: 50, price: 7.90, revenue: 395.00 },
    { item: 'Egg Mix MYO', date: '01/03/2025', quantity: 31, price: 8.90, revenue: 275.90 },
    { item: 'Redbull', date: '01/03/2025', quantity: 54, price: 4.50, revenue: 243.00 },
    { item: '600ml water', date: '01/03/2025', quantity: 115, price: 4.00, revenue: 460.00 },
  ]

  useEffect(() => {
    if (currentUser) {
      loadDashboardData()
    }
  }, [currentUser])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Use mock data for demo purposes
      setStats({
        totalInventoryItems: 1,
        totalSuppliers: 1,
        totalSalesRecords: 863,
        lowStockItems: 0,
        totalInventoryValue: 0,
        recentSales: mockRecentSales
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your smart stock management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inventory Items</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalInventoryItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-green-50 p-3 rounded-xl">
              <Building className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suppliers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="bg-orange-50 p-3 rounded-xl">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sales Records</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSalesRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Sales</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {mockRecentSales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{sale.item}</p>
                  <p className="text-sm text-gray-500">{sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {sale.quantity} × {formatCurrency(sale.price)}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <a
              href="/forecasting"
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
            >
              <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-blue-900">Upload Sales Data</p>
                <p className="text-sm text-blue-700">Upload CSV and generate forecasts</p>
              </div>
            </a>

            <a
              href="/inventory"
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
            >
              <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-green-900">Manage Inventory</p>
                <p className="text-sm text-green-700">Add, edit, or view inventory items</p>
              </div>
            </a>

            <a
              href="/orders"
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
            >
              <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-purple-900">AI Orders</p>
                <p className="text-sm text-purple-700">Generate smart supplier orders</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 