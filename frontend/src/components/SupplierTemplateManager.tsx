import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Building, 
  Package, 
  Mail, 
  Phone, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { 
  SupplierOrderTemplate, 
  OrderTemplateItem, 
  ContactInfo, 
  APIIntegration 
} from '../types/supplier'

interface SupplierTemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  onTemplateCreated: () => void
  editingTemplate?: SupplierOrderTemplate | null
}

const DELIVERY_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

const SUPPLIER_TYPES = [
  { value: 'ordermentum', label: 'Ordermentum' },
  { value: 'bidfood', label: 'Bidfood Australia' },
  { value: 'pfd', label: 'PFD Food Services' },
  { value: 'coles', label: 'Coles for Business' },
  { value: 'costco', label: 'Costco Business' },
  { value: 'email', label: 'Email Only' }
]

const PRODUCT_CATEGORIES = [
  'Meat & Poultry', 'Seafood', 'Dairy', 'Vegetables', 'Fruits', 'Dry Goods', 
  'Beverages', 'Bakery', 'Cleaning Supplies', 'Packaging', 'Other'
]

export default function SupplierTemplateManager({ 
  isOpen, 
  onClose, 
  onTemplateCreated, 
  editingTemplate 
}: SupplierTemplateManagerProps) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<SupplierOrderTemplate>({
    supplierId: '',
    supplierName: '',
    items: [],
    notes: '',
    preferredDeliveryDays: [],
    minimumOrderValue: 0,
    contactInfo: {
      rep: '',
      email: '',
      phone: ''
    },
    apiIntegration: {
      enabled: false,
      type: 'email'
    }
  })

  useEffect(() => {
    if (editingTemplate) {
      setFormData(editingTemplate)
    } else {
      resetForm()
    }
  }, [editingTemplate, isOpen])

  const resetForm = () => {
    setFormData({
      supplierId: '',
      supplierName: '',
      items: [],
      notes: '',
      preferredDeliveryDays: [],
      minimumOrderValue: 0,
      contactInfo: {
        rep: '',
        email: '',
        phone: ''
      },
      apiIntegration: {
        enabled: false,
        type: 'email'
      }
    })
    setError(null)
  }

  const addItem = () => {
    const newItem: OrderTemplateItem = {
      id: `item-${Date.now()}`,
      productName: '',
      defaultPackageSize: '',
      defaultQuantity: 1,
      unit: 'kg',
      lastPrice: 0,
      averageMonthlyUsage: 0,
      category: 'Other',
      essential: false
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const updateItem = (index: number, field: keyof OrderTemplateItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleDeliveryDayChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferredDeliveryDays: checked
        ? [...prev.preferredDeliveryDays, day]
        : prev.preferredDeliveryDays.filter(d => d !== day)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return

    // Validation
    if (!formData.supplierName.trim()) {
      setError('Supplier name is required')
      return
    }
    
    if (!formData.contactInfo.email.trim()) {
      setError('Contact email is required')
      return
    }

    if (formData.items.length === 0) {
      setError('At least one item is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const endpoint = editingTemplate 
        ? `/api/supplier-ordering/templates/${editingTemplate.id}`
        : '/api/supplier-ordering/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          ...formData,
          supplierId: formData.supplierId || `supplier-${Date.now()}`
        })
      })

      const result = await response.json()

      if (result.success) {
        onTemplateCreated()
        onClose()
        resetForm()
      } else {
        setError(result.error || 'Failed to save template')
      }
      
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Failed to save template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTemplate ? 'Edit' : 'Create'} Supplier Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="ml-2 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                required
                value={formData.supplierName}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                className="input-field"
                placeholder="e.g., Bidfood Australia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrderValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderValue: parseFloat(e.target.value) || 0 }))}
                  className="input-field pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Rep
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.rep}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, rep: e.target.value }
                  }))}
                  className="input-field"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.contactInfo.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    className="input-field pl-10"
                    placeholder="orders@supplier.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    className="input-field pl-10"
                    placeholder="+61 123 456 789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Preferences */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Delivery Preferences
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {DELIVERY_DAYS.map(day => (
                <label key={day} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.preferredDeliveryDays.includes(day)}
                    onChange={(e) => handleDeliveryDayChange(day, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* API Integration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              API Integration
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.apiIntegration?.enabled || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    apiIntegration: { 
                      type: 'email',
                      ...prev.apiIntegration, 
                      enabled: e.target.checked 
                    }
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">Enable API Integration</span>
              </label>

              {formData.apiIntegration?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Integration Type
                  </label>
                  <select
                    value={formData.apiIntegration.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      apiIntegration: { 
                        enabled: false,
                        ...prev.apiIntegration, 
                        type: e.target.value 
                      }
                    }))}
                    className="input-field"
                  >
                    {SUPPLIER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Coffee Beans"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Size
                      </label>
                      <input
                        type="text"
                        value={item.defaultPackageSize}
                        onChange={(e) => updateItem(index, 'defaultPackageSize', e.target.value)}
                        className="input-field"
                        placeholder="e.g., 1kg bag"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.defaultQuantity}
                        onChange={(e) => updateItem(index, 'defaultQuantity', parseInt(e.target.value) || 0)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="input-field"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pieces</option>
                        <option value="box">box</option>
                        <option value="bag">bag</option>
                        <option value="bottle">bottle</option>
                        <option value="carton">carton</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.lastPrice}
                        onChange={(e) => updateItem(index, 'lastPrice', parseFloat(e.target.value) || 0)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Usage
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.averageMonthlyUsage}
                        onChange={(e) => updateItem(index, 'averageMonthlyUsage', parseFloat(e.target.value) || 0)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(index, 'category', e.target.value)}
                        className="input-field"
                      >
                        {PRODUCT_CATEGORIES.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.essential}
                        onChange={(e) => updateItem(index, 'essential', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Essential Item</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No items added yet. Click "Add Item" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="input-field"
              placeholder="Special instructions, delivery preferences, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editingTemplate ? 'Update' : 'Create'} Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}