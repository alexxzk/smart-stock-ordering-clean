import { 
  addInventoryItem, 
  addMenuItem, 
  saveSalesData,
  InventoryItem,
  MenuItem 
} from '../services/firebaseService'

export const sampleInventoryItems = [
  {
    name: 'Coffee Beans',
    category: 'Beverages',
    currentStock: 25,
    minStock: 5,
    maxStock: 50,
    unit: 'kg',
    costPerUnit: 12.50,
    supplierId: 'SUP001'
  },
  {
    name: 'Milk',
    category: 'Dairy',
    currentStock: 15,
    minStock: 3,
    maxStock: 20,
    unit: 'l',
    costPerUnit: 1.80,
    supplierId: 'SUP002'
  },
  {
    name: 'Bread',
    category: 'Food',
    currentStock: 20,
    minStock: 5,
    maxStock: 40,
    unit: 'units',
    costPerUnit: 2.50,
    supplierId: 'SUP003'
  },
  {
    name: 'Chicken Breast',
    category: 'Meat',
    currentStock: 8,
    minStock: 2,
    maxStock: 15,
    unit: 'kg',
    costPerUnit: 18.00,
    supplierId: 'SUP004'
  },
  {
    name: 'Lettuce',
    category: 'Produce',
    currentStock: 12,
    minStock: 3,
    maxStock: 25,
    unit: 'kg',
    costPerUnit: 3.20,
    supplierId: 'SUP005'
  },
  {
    name: 'Tomatoes',
    category: 'Produce',
    currentStock: 18,
    minStock: 5,
    maxStock: 30,
    unit: 'kg',
    costPerUnit: 4.50,
    supplierId: 'SUP005'
  },
  {
    name: 'Cheese',
    category: 'Dairy',
    currentStock: 6,
    minStock: 2,
    maxStock: 12,
    unit: 'kg',
    costPerUnit: 15.80,
    supplierId: 'SUP002'
  },
  {
    name: 'Flour',
    category: 'Pantry',
    currentStock: 30,
    minStock: 5,
    maxStock: 50,
    unit: 'kg',
    costPerUnit: 1.20,
    supplierId: 'SUP003'
  },
  {
    name: 'Sugar',
    category: 'Pantry',
    currentStock: 15,
    minStock: 3,
    maxStock: 25,
    unit: 'kg',
    costPerUnit: 2.10,
    supplierId: 'SUP003'
  },
  {
    name: 'Olive Oil',
    category: 'Pantry',
    currentStock: 8,
    minStock: 2,
    maxStock: 15,
    unit: 'l',
    costPerUnit: 12.00,
    supplierId: 'SUP003'
  }
]

export const sampleMenuItems = [
  {
    name: 'Cappuccino',
    category: 'Beverages',
    price: 4.50,
    ingredients: [
      { itemId: '', itemName: 'Coffee Beans', quantity: 0.02, unit: 'kg' },
      { itemId: '', itemName: 'Milk', quantity: 0.15, unit: 'l' }
    ]
  },
  {
    name: 'Grilled Chicken Sandwich',
    category: 'Main Course',
    price: 12.90,
    ingredients: [
      { itemId: '', itemName: 'Chicken Breast', quantity: 0.15, unit: 'kg' },
      { itemId: '', itemName: 'Bread', quantity: 1, unit: 'units' },
      { itemId: '', itemName: 'Lettuce', quantity: 0.05, unit: 'kg' },
      { itemId: '', itemName: 'Tomatoes', quantity: 0.08, unit: 'kg' }
    ]
  },
  {
    name: 'Caesar Salad',
    category: 'Salads',
    price: 9.80,
    ingredients: [
      { itemId: '', itemName: 'Lettuce', quantity: 0.12, unit: 'kg' },
      { itemId: '', itemName: 'Cheese', quantity: 0.03, unit: 'kg' },
      { itemId: '', itemName: 'Olive Oil', quantity: 0.02, unit: 'l' }
    ]
  },
  {
    name: 'Margherita Pizza',
    category: 'Main Course',
    price: 15.50,
    ingredients: [
      { itemId: '', itemName: 'Flour', quantity: 0.2, unit: 'kg' },
      { itemId: '', itemName: 'Tomatoes', quantity: 0.1, unit: 'kg' },
      { itemId: '', itemName: 'Cheese', quantity: 0.15, unit: 'kg' },
      { itemId: '', itemName: 'Olive Oil', quantity: 0.02, unit: 'l' }
    ]
  },
  {
    name: 'Latte',
    category: 'Beverages',
    price: 5.20,
    ingredients: [
      { itemId: '', itemName: 'Coffee Beans', quantity: 0.025, unit: 'kg' },
      { itemId: '', itemName: 'Milk', quantity: 0.2, unit: 'l' }
    ]
  }
]

export const sampleSalesData = [
  {
    date: new Date().toISOString().split('T')[0],
    item: 'Cappuccino',
    quantity: 15,
    revenue: 67.50
  },
  {
    date: new Date().toISOString().split('T')[0],
    item: 'Grilled Chicken Sandwich',
    quantity: 8,
    revenue: 103.20
  },
  {
    date: new Date().toISOString().split('T')[0],
    item: 'Caesar Salad',
    quantity: 5,
    revenue: 49.00
  },
  {
    date: new Date().toISOString().split('T')[0],
    item: 'Latte',
    quantity: 12,
    revenue: 62.40
  },
  {
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    item: 'Cappuccino',
    quantity: 18,
    revenue: 81.00
  },
  {
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    item: 'Margherita Pizza',
    quantity: 6,
    revenue: 93.00
  }
]

export const addSampleInventoryData = async (userId: string) => {
  try {
    console.log('Adding sample inventory data...')
    const promises = sampleInventoryItems.map(item => 
      addInventoryItem({ ...item, userId })
    )
    await Promise.all(promises)
    console.log('Sample inventory data added successfully!')
    return true
  } catch (error) {
    console.error('Error adding sample inventory data:', error)
    throw error
  }
}

export const addSampleMenuData = async (userId: string, inventoryItems: any[]) => {
  try {
    console.log('Adding sample menu data...')
    
    // Map ingredient names to IDs
    const menuItemsWithIds = sampleMenuItems.map(menuItem => ({
      ...menuItem,
      ingredients: menuItem.ingredients.map(ingredient => {
        const inventoryItem = inventoryItems.find(item => item.name === ingredient.itemName)
        return {
          ...ingredient,
          itemId: inventoryItem?.id || ''
        }
      })
    }))
    
    const promises = menuItemsWithIds.map(item => 
      addMenuItem({ ...item, userId })
    )
    await Promise.all(promises)
    console.log('Sample menu data added successfully!')
    return true
  } catch (error) {
    console.error('Error adding sample menu data:', error)
    throw error
  }
}

export const addSampleSalesData = async (userId: string) => {
  try {
    console.log('Adding sample sales data...')
    const promises = sampleSalesData.map(sale => 
      saveSalesData({ ...sale, userId })
    )
    await Promise.all(promises)
    console.log('Sample sales data added successfully!')
    return true
  } catch (error) {
    console.error('Error adding sample sales data:', error)
    throw error
  }
}

export const addAllSampleData = async (userId: string) => {
  try {
    // Add inventory first
    await addSampleInventoryData(userId)
    
    // Get the added inventory items to map IDs
    // Note: In a real implementation, you'd fetch the items after adding them
    // For now, we'll add menu items without proper ID mapping
    
    // Add menu items
    await addSampleMenuData(userId, [])
    
    // Add sales data
    await addSampleSalesData(userId)
    
    return {
      success: true,
      message: 'All sample data added successfully!'
    }
  } catch (error) {
    console.error('Error adding all sample data:', error)
    return {
      success: false,
      message: 'Failed to add sample data. Please try again.'
    }
  }
}