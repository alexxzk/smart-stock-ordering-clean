import React, { useState, useEffect, useCallback } from 'react'
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Minus,
  Edit3,
  Send,
  FileText,
  Mail,
  Zap,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Settings,
  Download,
  Users,
  DollarSign,
  Truck,
  Star,
  Brain
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SupplierTemplateManager from '../components/SupplierTemplateManager'
import type { 
  SupplierOrderTemplate, 
  OrderTemplateItem, 
  SmartOrderSuggestion, 
  BatchOrder 
} from '../types/supplier'

export default function SupplierOrdering() {
  const { currentUser } = useAuth()
  const [templates, setTemplates] = useState<SupplierOrderTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [orderItems, setOrderItems] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(false)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartOrderSuggestion[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SupplierOrderTemplate | null>(null)

  // Load templates and smart suggestions
  useEffect(() => {
    if (currentUser) {
      loadOrderTemplates()
      loadSmartSuggestions()
    }
  }, [currentUser])

  const loadOrderTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/supplier-ordering/templates', {
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        }
      })
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSmartSuggestions = async () => {
    try {
      const response = await fetch('/api/supplier-ordering/smart-suggestions', {
        headers: {
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        }
      })
      const data = await response.json()
      setSmartSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Error loading smart suggestions:', error)
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setOrderItems((prev: { [key: string]: number }) => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }))
  }

  const calculateOrderTotal = (template: SupplierOrderTemplate) => {
    return template.items.reduce((total, item) => {
      const quantity = orderItems[item.id] || item.defaultQuantity
      const price = item.lastPrice || 0
      return total + (quantity * price)
    }, 0)
  }

  const placeOrder = async (template: SupplierOrderTemplate) => {
    try {
      setLoading(true)
      
      const orderData = {
        supplierId: template.supplierId,
        supplierName: template.supplierName,
        items: template.items.map(item => ({
          ...item,
          quantity: orderItems[item.id] || item.defaultQuantity
        })).filter(item => item.quantity > 0),
        notes: orderNotes,
        deliveryDate,
        total: calculateOrderTotal(template),
        apiIntegration: template.apiIntegration
      }

      const response = await fetch('/api/supplier-ordering/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Order placed successfully! ${result.orderId ? `Order ID: ${result.orderId}` : 'Order sent via email.'}`)
        setOrderItems({})
        setOrderNotes('')
        setDeliveryDate('')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const placeBatchOrder = async () => {
    try {
      setLoading(true)
      
      const batchOrderData = {
        suppliers: selectedSuppliers,
        deliveryDate,
        notes: orderNotes,
        items: selectedSuppliers.reduce((acc, supplierId) => {
          const template = templates.find(t => t.supplierId === supplierId)
          if (template) {
            acc[supplierId] = template.items.map(item => ({
              ...item,
              quantity: orderItems[item.id] || item.defaultQuantity
            })).filter(item => item.quantity > 0)
          }
          return acc
        }, {} as { [key: string]: any[] })
      }

      const response = await fetch('/api/supplier-ordering/batch-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(batchOrderData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Batch order placed successfully! ${result.orderIds?.length} orders sent.`)
        setBatchMode(false)
        setSelectedSuppliers([])
        setOrderItems({})
        setOrderNotes('')
        setDeliveryDate('')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error placing batch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const applySmartSuggestions = () => {
    const newOrderItems = { ...orderItems }
    smartSuggestions.forEach(suggestion => {
      newOrderItems[suggestion.itemId] = suggestion.suggestedQuantity
    })
    setOrderItems(newOrderItems)
  }

  const generatePDF = async (template: SupplierOrderTemplate) => {
    try {
      const orderData = {
        supplier: template,
        items: template.items.map(item => ({
          ...item,
          quantity: orderItems[item.id] || item.defaultQuantity
        })).filter(item => item.quantity > 0),
        total: calculateOrderTotal(template),
        date: new Date().toISOString(),
        notes: orderNotes
      }

      const response = await fetch('/api/supplier-ordering/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify(orderData)
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order-${template.supplierName}-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const currentTemplate = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Ordering</h2>
          <p className="text-gray-600">Streamlined ordering from all your suppliers</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              batchMode 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Batch Mode</span>
          </button>
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Manage Templates</span>
          </button>
        </div>
      </div>

      {/* Smart Ordering Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="card border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Smart Order Suggestions</h3>
            </div>
            <button
              onClick={applySmartSuggestions}
              className="btn-primary text-sm"
            >
              Apply All Suggestions
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartSuggestions.slice(0, 6).map((suggestion) => (
              <div key={suggestion.itemId} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{suggestion.productName}</h4>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`h-4 w-4 ${
                      suggestion.trendDirection === 'up' ? 'text-green-600' : 
                      suggestion.trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                    <span className="text-sm font-medium">{suggestion.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                <div className="flex justify-between text-sm">
                  <span>Current: {suggestion.currentStock}</span>
                  <span className="font-medium">Suggest: {suggestion.suggestedQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Mode Selection */}
      {batchMode && (
        <div className="card border-purple-200 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Batch Order - Select Suppliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <label key={template.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(template.supplierId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSuppliers([...selectedSuppliers, template.supplierId])
                    } else {
                      setSelectedSuppliers(selectedSuppliers.filter(id => id !== template.supplierId))
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{template.supplierName}</p>
                  <p className="text-sm text-gray-600">{template.items.length} items</p>
                </div>
              </label>
            ))}
          </div>
          
          {selectedSuppliers.length > 0 && (
            <div className="mt-4 flex space-x-4">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="input-field"
                placeholder="Delivery Date"
              />
              <button
                onClick={placeBatchOrder}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Place Batch Order ({selectedSuppliers.length} suppliers)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Supplier Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Selection */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Supplier</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id || '')}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.supplierName}</h4>
                    <div className="flex items-center space-x-1">
                      {template.apiIntegration?.enabled && (
                        <Zap className="h-4 w-4 text-green-600" />
                      )}
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{template.items.length} items in template</p>
                    <p>Min order: ${template.minimumOrderValue}</p>
                    {template.preferredDeliveryDays.length > 0 && (
                      <p>Delivery: {template.preferredDeliveryDays.join(', ')}</p>
                    )}
                    {template.lastOrderDate && (
                      <p>Last order: {new Date(template.lastOrderDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  
                  {template.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      {template.notes}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="lg:col-span-2">
          {currentTemplate ? (
            <div className="space-y-6">
              {/* Order Items */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order from {currentTemplate.supplierName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Total: ${calculateOrderTotal(currentTemplate).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentTemplate.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          {item.essential && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Essential
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{item.defaultPackageSize} • Default: {item.defaultQuantity} {item.unit}</p>
                          {item.lastPrice && <p>Last price: ${item.lastPrice.toFixed(2)}</p>}
                          {item.averageMonthlyUsage && (
                            <p>Monthly usage: {item.averageMonthlyUsage} {item.unit}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, (orderItems[item.id] || item.defaultQuantity) - 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={orderItems[item.id] || item.defaultQuantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, (orderItems[item.id] || item.defaultQuantity) + 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-500 w-12">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Rep
                    </label>
                    <input
                      type="text"
                      value={currentTemplate.contactInfo.rep}
                      className="input-field"
                      disabled
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Special instructions, delivery notes, etc."
                  />
                </div>

                {/* Order Actions */}
                <div className="flex flex-wrap gap-3">
                  {currentTemplate.apiIntegration?.enabled ? (
                    <button
                      onClick={() => placeOrder(currentTemplate)}
                      disabled={loading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Place Order (API)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => generatePDF(currentTemplate)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Generate PDF</span>
                      </button>
                      <button
                        onClick={() => placeOrder(currentTemplate)}
                        disabled={loading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Send Email Order</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Supplier Info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Rep: {currentTemplate.contactInfo.rep}</p>
                      <p>Email: {currentTemplate.contactInfo.email}</p>
                      <p>Phone: {currentTemplate.contactInfo.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Order Requirements</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Minimum Order: ${currentTemplate.minimumOrderValue}</p>
                      <p>Delivery Days: {currentTemplate.preferredDeliveryDays.join(', ')}</p>
                      {currentTemplate.apiIntegration?.enabled && (
                        <p>API Integration: {currentTemplate.apiIntegration.type}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Supplier</h3>
              <p className="text-gray-600">Choose a supplier from the list to start ordering</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Manager Modal */}
      <SupplierTemplateManager
        isOpen={showTemplateEditor}
        onClose={() => {
          setShowTemplateEditor(false)
          setEditingTemplate(null)
        }}
        onTemplateCreated={loadOrderTemplates}
        editingTemplate={editingTemplate}
      />
    </div>
  )
}