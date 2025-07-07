import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Package,
  Activity,
  Clock
} from 'lucide-react';

interface POSSystem {
  id: string;
  name: string;
  integration_type: string;
  features: string[];
  contact: {
    website?: string;
    documentation?: string;
  };
  description: string;
  status: string;
}

interface SalesData {
  transaction_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  pos_system: string;
}

interface Analytics {
  summary: {
    total_revenue: number;
    total_transactions: number;
    total_items_sold: number;
    average_transaction_value: number;
    date_range: string;
  };
  top_selling_items: Array<{
    item_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  daily_sales: Record<string, {
    revenue: number;
    items_sold: number;
  }>;
}

interface Recommendation {
  item_name: string;
  current_sales_velocity: number;
  total_sold_in_period: number;
  recommended_order_qty: number;
  urgency: 'high' | 'medium' | 'low';
  revenue_impact: number;
}

const POSIntegrations: React.FC = () => {
  const [posSystems, setPOSSystems] = useState<Record<string, POSSystem>>({});
  const [selectedPOS, setSelectedPOS] = useState<string>('square');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPOSSystems();
    fetchMockData();
  }, []);

  const fetchPOSSystems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pos-integrations/pos-systems', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPOSSystems(data.pos_systems || {});
      }
    } catch (error) {
      console.error('Error fetching POS systems:', error);
    }
  };

  const fetchMockData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pos-integrations/mock-data?pos_id=${selectedPOS}&days=30`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setRecommendations(data.recommendations);
        setSalesData(data.sales_data);
      }
    } catch (error) {
      console.error('Error fetching mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/pos-integrations/analytics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pos_id: selectedPOS,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/pos-integrations/recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pos_id: selectedPOS,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Activity className="inline-block w-8 h-8 mr-3 text-blue-600" />
          POS Integration & Sales Analytics
        </h1>
        <p className="text-gray-600">
          Connect your Point of Sale system to get real-time sales data and AI-powered ordering recommendations.
        </p>
      </div>

      {/* POS System Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select POS System</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(posSystems).map(([id, system]) => (
            <div
              key={id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPOS === id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPOS(id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{system.name}</h3>
                <CheckCircle className={`w-5 h-5 ${selectedPOS === id ? 'text-blue-600' : 'text-gray-300'}`} />
              </div>
              <p className="text-sm text-gray-600 mb-2">{system.description}</p>
              <div className="flex flex-wrap gap-1">
                {system.features.slice(0, 2).map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date Range & Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Get Analytics
            </button>
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Get Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.summary.total_revenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.total_transactions.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.total_items_sold.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.summary.average_transaction_value)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Top Selling Items */}
      {analytics && analytics.top_selling_items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Top Selling Items
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Item</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Quantity Sold</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_selling_items.slice(0, 10).map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-4 font-medium">{item.item_name}</td>
                    <td className="py-2 px-4">{item.quantity_sold}</td>
                    <td className="py-2 px-4">{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            AI Ordering Recommendations
          </h2>
          <div className="space-y-4">
            {recommendations.slice(0, 10).map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg">{rec.item_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(rec.urgency)}`}>
                    {rec.urgency.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Velocity</p>
                    <p className="font-medium">{rec.current_sales_velocity}/day</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Sold</p>
                    <p className="font-medium">{rec.total_sold_in_period}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Recommended Order</p>
                    <p className="font-medium text-green-600">{rec.recommended_order_qty} units</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Revenue Impact</p>
                    <p className="font-medium">{formatCurrency(rec.revenue_impact)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Sales Chart */}
      {analytics && Object.keys(analytics.daily_sales).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Daily Sales Trend
          </h2>
          <div className="space-y-2">
            {Object.entries(analytics.daily_sales).slice(-14).map(([date, data]) => (
              <div key={date} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
                <span className="font-medium">{formatDate(date)}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{data.items_sold} items</span>
                  <span className="font-medium">{formatCurrency(data.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading POS data...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analytics && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-6">
            Click "Get Analytics" to fetch sales data from your POS system, or try the mock data to see how it works.
          </p>
          <button
            onClick={fetchMockData}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Load Demo Data
          </button>
        </div>
      )}
    </div>
  );
};

export default POSIntegrations;