import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ChefHat, AlertTriangle, CheckCircle, Loader2, Calculator, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getMenuItems, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getInventoryItems,
  MenuItem as MenuItemType,
  InventoryItem 
} from '../services/firebaseService'

interface MenuFormData {
  name: string
  category: string
  price: string
  ingredients: {
    itemId: string
    itemName: string
    quantity: string
    unit: string
  }[]
}

const menuCategories = [
  'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 
  'Soups', 'Sides', 'Snacks', 'Specials', 'Other'
]

export default function MenuRecipes() {
  const { currentUser } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemType | null>(null)
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    category: 'Main Course',
    price: '',
    ingredients: []
  })

  const loadData = useCallback(async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      setError(null)
      
      const [menuData, inventoryData] = await Promise.all([
        getMenuItems(currentUser.uid),
        getInventoryItems(currentUser.uid)
      ])
      
      setMenuItems(menuData)
      setInventoryItems(inventoryData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser, loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return

    if (formData.ingredients.length === 0) {
      setError('Please add at least one ingredient')
      return
    }

    try {
      setLoading(true)
      
      const menuItemData = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        ingredients: formData.ingredients.map(ing => ({
          itemId: ing.itemId,
          itemName: ing.itemName,
          quantity: Number(ing.quantity),
          unit: ing.unit
        })),
        userId: currentUser.uid
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id!, menuItemData)
      } else {
        await addMenuItem(menuItemData)
      }
      
      setShowForm(false)
      setEditingItem(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error('Error saving menu item:', error)
      setError('Failed to save menu item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: MenuItemType) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      price: String(item.price),
      ingredients: item.ingredients.map(ing => ({
        itemId: ing.itemId,
        itemName: ing.itemName,
        quantity: String(ing.quantity),
        unit: ing.unit
      }))
    })
    setShowForm(true)
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        setLoading(true)
        await deleteMenuItem(itemId)
        await loadData()
      } catch (error) {
        console.error('Error deleting menu item:', error)
        setError('Failed to delete menu item. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Main Course',
      price: '',
      ingredients: []
    })
  }

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, {
        itemId: '',
        itemName: '',
        quantity: '',
        unit: 'kg'
      }]
    })
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updatedIngredients = [...formData.ingredients]
    
    if (field === 'itemId') {
      const selectedItem = inventoryItems.find(item => item.id === value)
      if (selectedItem) {
        updatedIngredients[index] = {
          ...updatedIngredients[index],
          itemId: value,
          itemName: selectedItem.name,
          unit: selectedItem.unit
        }
      }
    } else {
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      }
    }
    
    setFormData({
      ...formData,
      ingredients: updatedIngredients
    })
  }

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_: any, i: number) => i !== index)
    })
  }

  const calculateRecipeCost = (ingredients: any[]) => {
    return ingredients.reduce((total: number, ing: any) => {
      const inventoryItem = inventoryItems.find((item: InventoryItem) => item.id === ing.itemId || item.name === ing.itemName)
      if (inventoryItem) {
        return total + (ing.quantity * inventoryItem.costPerUnit)
      }
      return total
    }, 0)
  }

  const getMarginInfo = (menuItem: MenuItemType) => {
    const cost = calculateRecipeCost(menuItem.ingredients)
    const profit = menuItem.price - cost
    const marginPercent = cost > 0 ? (profit / menuItem.price) * 100 : 0
    
    return {
      cost,
      profit,
      marginPercent,
      status: marginPercent > 60 ? 'excellent' : marginPercent > 40 ? 'good' : marginPercent > 20 ? 'fair' : 'poor'
    }
  }

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu & Recipes</h2>
          <p className="text-gray-600">Manage your menu items, recipes, and cost analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowForm(true)
            }}
            className="btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="ml-2 text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <ChefHat className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Menu Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : menuItems.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${menuItems.length > 0 ? (menuItems.reduce((sum, item) => sum + calculateRecipeCost(item.ingredients), 0) / menuItems.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Good Margin</p>
              <p className="text-2xl font-semibold text-gray-900">
                {menuItems.filter(item => getMarginInfo(item).marginPercent > 40).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Margin</p>
              <p className="text-2xl font-semibold text-gray-900">
                {menuItems.filter(item => getMarginInfo(item).marginPercent < 20).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Grilled Chicken Sandwich"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {menuCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Ingredients Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Recipe Ingredients</h4>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>
              
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inventory Item *
                    </label>
                    <select
                      required
                      value={ingredient.itemId}
                      onChange={(e) => updateIngredient(index, 'itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select item...</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={ingredient.unit}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="btn-danger flex items-center space-x-2 w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Cost Preview */}
            {formData.ingredients.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-blue-900 mb-2">Cost Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Recipe Cost:</p>
                    <p className="font-semibold text-blue-900">
                      ${calculateRecipeCost(formData.ingredients.map(ing => ({
                        ...ing,
                        quantity: Number(ing.quantity)
                      }))).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Selling Price:</p>
                    <p className="font-semibold text-blue-900">${formData.price || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Profit:</p>
                    <p className="font-semibold text-blue-900">
                      ${formData.price ? (Number(formData.price) - calculateRecipeCost(formData.ingredients.map(ing => ({
                        ...ing,
                        quantity: Number(ing.quantity)
                      })))).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Margin:</p>
                    <p className="font-semibold text-blue-900">
                      {formData.price ? (((Number(formData.price) - calculateRecipeCost(formData.ingredients.map(ing => ({
                        ...ing,
                        quantity: Number(ing.quantity)
                      })))) / Number(formData.price)) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingItem(null)
                  resetForm()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingItem ? 'Update Menu Item' : 'Add Menu Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Menu Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map((item) => {
                const marginInfo = getMarginInfo(item)
                
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.ingredients.length} ingredients</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${marginInfo.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        marginInfo.status === 'excellent' ? 'bg-green-100 text-green-800' :
                        marginInfo.status === 'good' ? 'bg-blue-100 text-blue-800' :
                        marginInfo.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {marginInfo.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedMenuItem(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {menuItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first menu item.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      {selectedMenuItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedMenuItem.name} Recipe</h3>
                <button
                  onClick={() => setSelectedMenuItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-gray-900">{selectedMenuItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-gray-900">${selectedMenuItem.price.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Ingredients</p>
                  <div className="space-y-2">
                    {selectedMenuItem.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-900">{ingredient.itemName}</span>
                        <span className="text-gray-600">{ingredient.quantity} {ingredient.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">Cost Analysis</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Recipe Cost: ${getMarginInfo(selectedMenuItem).cost.toFixed(2)}</p>
                      <p className="text-blue-700">Profit: ${getMarginInfo(selectedMenuItem).profit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Margin: {getMarginInfo(selectedMenuItem).marginPercent.toFixed(1)}%</p>
                      <p className="text-blue-700">Status: <span className="capitalize">{getMarginInfo(selectedMenuItem).status}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}