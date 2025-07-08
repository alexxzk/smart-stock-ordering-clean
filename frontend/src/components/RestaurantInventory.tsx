import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Package,
  Tag,
  DollarSign,
  Download,
  Upload,
  Grid,
  List,
  CheckSquare,
  X,
  RefreshCw,
  AlertCircle,
  ChefHat,
  Scale,
  Clock,
  Utensils,
  TrendingDown,
  BarChart3,
  Receipt,
  Minus
} from 'lucide-react';
import './RestaurantInventory.css';

interface Ingredient {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  supplier: string;
  type: string; // Fresh, Frozen, Canned, Dried, etc.
  unit: string; // kg, lbs, liters, pieces, etc.
  cost_per_unit: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  expiry_date?: string;
  sku?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_restocked: string;
  supplier_contact?: string;
  storage_location?: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string; // Main, Side, Dessert, Drink
  selling_price: number;
  preparation_time: number; // in minutes
  serving_size: number;
  ingredients: RecipeIngredient[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name: string;
  quantity_needed: number;
  unit: string;
  cost: number;
}

interface Sale {
  id: string;
  pos_system: string; // Square, Toast, etc.
  transaction_id: string;
  recipe_id: string;
  recipe_name: string;
  quantity_sold: number;
  sale_price: number;
  timestamp: string;
  ingredients_deducted: RecipeIngredient[];
}

interface IngredientCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const RestaurantInventory: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'sales' | 'pos'>('inventory');
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStockLevel, setFilterStockLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form States
  const [ingredientForm, setIngredientForm] = useState<Partial<Ingredient>>({
    name: '',
    category_id: '',
    supplier: '',
    type: '',
    unit: '',
    cost_per_unit: 0,
    current_stock: 0,
    min_stock_level: 5,
    max_stock_level: 100,
    description: ''
  });

  const [recipeForm, setRecipeForm] = useState<Partial<Recipe>>({
    name: '',
    description: '',
    category: '',
    selling_price: 0,
    preparation_time: 0,
    serving_size: 1,
    ingredients: [],
    is_active: true
  });

  // Predefined categories for restaurant ingredients
  const ingredientCategories: IngredientCategory[] = [
    { id: 'fruits-vegetables', name: 'Fruits & Vegetables', icon: '🥗', color: '#22c55e' },
    { id: 'meats-seafood', name: 'Meats & Seafood', icon: '🥩', color: '#ef4444' },
    { id: 'dairy-eggs', name: 'Dairy & Eggs', icon: '🥛', color: '#3b82f6' },
    { id: 'grains-starches', name: 'Grains & Starches', icon: '🌾', color: '#f59e0b' },
    { id: 'spices-condiments', name: 'Spices & Condiments', icon: '🧂', color: '#8b5cf6' },
    { id: 'beverages', name: 'Beverages', icon: '🥤', color: '#06b6d4' },
    { id: 'oils-fats', name: 'Oils & Fats', icon: '🫒', color: '#84cc16' },
    { id: 'frozen-foods', name: 'Frozen Foods', icon: '🧊', color: '#0ea5e9' },
    { id: 'cleaning-supplies', name: 'Cleaning & Supplies', icon: '🧽', color: '#64748b' }
  ];

  const ingredientTypes = ['Fresh', 'Frozen', 'Canned', 'Dried', 'Organic', 'Premium', 'Standard'];
  const units = ['kg', 'g', 'lbs', 'oz', 'liters', 'ml', 'pieces', 'boxes', 'cases', 'bottles'];
  const suppliers = ['Local Supplier', 'Sysco', 'US Foods', 'Gordon Food Service', 'Costco', 'Restaurant Depot', 'Other'];
  const recipeCategories = ['Main Course', 'Appetizer', 'Side Dish', 'Dessert', 'Beverage', 'Salad', 'Soup'];

  // Sample ingredients for different categories
  const sampleIngredients = {
    'fruits-vegetables': [
      'Tomatoes', 'Onions', 'Potatoes', 'Carrots', 'Lettuce', 'Spinach', 'Bell Peppers',
      'Mushrooms', 'Garlic', 'Ginger', 'Lemons', 'Limes', 'Apples', 'Bananas'
    ],
    'meats-seafood': [
      'Chicken Breast', 'Chicken Thighs', 'Ground Beef', 'Beef Steak', 'Pork Chops',
      'Bacon', 'Salmon Fillet', 'Shrimp', 'Cod Fillet', 'Schnitzel'
    ],
    'dairy-eggs': [
      'Whole Milk', 'Heavy Cream', 'Butter', 'Mozzarella Cheese', 'Cheddar Cheese',
      'Parmesan Cheese', 'Large Eggs', 'Cream Cheese'
    ],
    'grains-starches': [
      'White Rice', 'Brown Rice', 'Pasta', 'Bread Flour', 'All-Purpose Flour',
      'Quinoa', 'Potatoes', 'Sweet Potatoes'
    ],
    'spices-condiments': [
      'Salt', 'Black Pepper', 'Olive Oil', 'Vegetable Oil', 'Oregano', 'Basil',
      'Paprika', 'Cumin', 'Garlic Powder'
    ]
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data from localStorage
      const ingredientsData = loadIngredientsFromStorage();
      const recipesData = loadRecipesFromStorage();
      const salesData = loadSalesFromStorage();
      
      setIngredients(ingredientsData);
      setRecipes(recipesData);
      setSales(salesData);
      
    } catch (err) {
      console.error('Error loading restaurant data:', err);
      setError('Failed to load restaurant inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadIngredientsFromStorage = (): Ingredient[] => {
    try {
      const saved = localStorage.getItem('restaurant_ingredients');
      if (saved) {
        const data = JSON.parse(saved);
        return data.ingredients || [];
      }
    } catch (err) {
      console.error('Failed to load ingredients:', err);
    }
    return [];
  };

  const loadRecipesFromStorage = (): Recipe[] => {
    try {
      const saved = localStorage.getItem('restaurant_recipes');
      if (saved) {
        const data = JSON.parse(saved);
        return data.recipes || [];
      }
    } catch (err) {
      console.error('Failed to load recipes:', err);
    }
    return [];
  };

  const loadSalesFromStorage = (): Sale[] => {
    try {
      const saved = localStorage.getItem('restaurant_sales');
      if (saved) {
        const data = JSON.parse(saved);
        return data.sales || [];
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    }
    return [];
  };

  const saveIngredientsToStorage = (ingredientsToSave: Ingredient[]) => {
    try {
      const dataToSave = {
        ingredients: ingredientsToSave,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('restaurant_ingredients', JSON.stringify(dataToSave));
      console.log('✅ Restaurant ingredients saved');
    } catch (err) {
      console.error('Failed to save ingredients:', err);
    }
  };

  const saveRecipesToStorage = (recipesToSave: Recipe[]) => {
    try {
      const dataToSave = {
        recipes: recipesToSave,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('restaurant_recipes', JSON.stringify(dataToSave));
      console.log('✅ Restaurant recipes saved');
    } catch (err) {
      console.error('Failed to save recipes:', err);
    }
  };

  const saveSalesToStorage = (salesToSave: Sale[]) => {
    try {
      const dataToSave = {
        sales: salesToSave,
        lastSaved: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('restaurant_sales', JSON.stringify(dataToSave));
      console.log('✅ Restaurant sales saved');
    } catch (err) {
      console.error('Failed to save sales:', err);
    }
  };

  // Stock level utilities
  const getStockLevel = (ingredient: Ingredient) => {
    if (ingredient.current_stock === 0) return 'out-of-stock';
    if (ingredient.current_stock <= ingredient.min_stock_level) return 'critical';
    if (ingredient.current_stock <= ingredient.min_stock_level * 2) return 'low';
    if (ingredient.current_stock >= ingredient.max_stock_level) return 'overstocked';
    return 'good';
  };

  const getStockWarning = (ingredient: Ingredient) => {
    const level = getStockLevel(ingredient);
    switch (level) {
      case 'out-of-stock':
        return { message: 'Out of Stock', color: '#dc2626', icon: '🚫' };
      case 'critical':
        return { message: `Critical (${ingredient.current_stock} ${ingredient.unit})`, color: '#dc2626', icon: '🚨' };
      case 'low':
        return { message: `Low Stock (${ingredient.current_stock} ${ingredient.unit})`, color: '#f59e0b', icon: '⚠️' };
      case 'overstocked':
        return { message: `Overstocked (${ingredient.current_stock} ${ingredient.unit})`, color: '#7c3aed', icon: '📦' };
      default:
        return { message: `${ingredient.current_stock} ${ingredient.unit}`, color: '#10b981', icon: '✅' };
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ingredientForm.name || !ingredientForm.category_id || !ingredientForm.supplier) {
      alert('Please fill in all required fields');
      return;
    }

    const newIngredient: Ingredient = {
      id: `ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: ingredientForm.name!,
      category_id: ingredientForm.category_id!,
      category_name: ingredientCategories.find(cat => cat.id === ingredientForm.category_id)?.name || '',
      supplier: ingredientForm.supplier!,
      type: ingredientForm.type || 'Standard',
      unit: ingredientForm.unit || 'kg',
      cost_per_unit: ingredientForm.cost_per_unit || 0,
      current_stock: ingredientForm.current_stock || 0,
      min_stock_level: ingredientForm.min_stock_level || 5,
      max_stock_level: ingredientForm.max_stock_level || 100,
      expiry_date: ingredientForm.expiry_date,
      sku: ingredientForm.sku || `${ingredientForm.category_id}-${Date.now()}`,
      description: ingredientForm.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_restocked: new Date().toISOString(),
      supplier_contact: ingredientForm.supplier_contact,
      storage_location: ingredientForm.storage_location
    };

    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    saveIngredientsToStorage(updatedIngredients);

    // Reset form
    setIngredientForm({
      name: '',
      category_id: '',
      supplier: '',
      type: '',
      unit: '',
      cost_per_unit: 0,
      current_stock: 0,
      min_stock_level: 5,
      max_stock_level: 100,
      description: ''
    });
    setShowAddForm(false);
    
    alert(`✅ Ingredient "${newIngredient.name}" added successfully!`);
  };

  // Recipe Management
  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipeForm.name || !recipeForm.category || recipeForm.ingredients?.length === 0) {
      alert('Please fill in recipe name, category, and add at least one ingredient');
      return;
    }

    const totalCost = recipeForm.ingredients?.reduce((sum, ing) => sum + ing.cost, 0) || 0;

    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: recipeForm.name!,
      description: recipeForm.description || '',
      category: recipeForm.category!,
      selling_price: recipeForm.selling_price || 0,
      preparation_time: recipeForm.preparation_time || 0,
      serving_size: recipeForm.serving_size || 1,
      ingredients: recipeForm.ingredients || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: recipeForm.is_active !== false
    };

    const updatedRecipes = [...recipes, newRecipe];
    setRecipes(updatedRecipes);
    saveRecipesToStorage(updatedRecipes);

    // Reset form
    setRecipeForm({
      name: '',
      description: '',
      category: '',
      selling_price: 0,
      preparation_time: 0,
      serving_size: 1,
      ingredients: [],
      is_active: true
    });
    setShowRecipeForm(false);
    
    alert(`✅ Recipe "${newRecipe.name}" created successfully! Cost: $${totalCost.toFixed(2)}`);
  };

  // POS Integration - Simulate sale and auto-deduct inventory
  const processSale = (recipeId: string, quantity: number, posSystem: string = 'Manual') => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      alert('Recipe not found!');
      return;
    }

    // Check if we have enough ingredients
    const insufficientIngredients: string[] = [];
    
    recipe.ingredients.forEach(recipeIng => {
      const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredient_id);
      if (!ingredient) {
        insufficientIngredients.push(`${recipeIng.ingredient_name} (not found)`);
        return;
      }
      
      const neededQuantity = recipeIng.quantity_needed * quantity;
      if (ingredient.current_stock < neededQuantity) {
        insufficientIngredients.push(
          `${ingredient.name} (need ${neededQuantity}${ingredient.unit}, have ${ingredient.current_stock}${ingredient.unit})`
        );
      }
    });

    if (insufficientIngredients.length > 0) {
      alert(`❌ Insufficient ingredients:\n${insufficientIngredients.join('\n')}`);
      return;
    }

    // Deduct ingredients from inventory
    const updatedIngredients = ingredients.map(ingredient => {
      const recipeIng = recipe.ingredients.find(ri => ri.ingredient_id === ingredient.id);
      if (recipeIng) {
        const deductedQuantity = recipeIng.quantity_needed * quantity;
        return {
          ...ingredient,
          current_stock: ingredient.current_stock - deductedQuantity,
          updated_at: new Date().toISOString()
        };
      }
      return ingredient;
    });

    // Record the sale
    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pos_system: posSystem,
      transaction_id: `TXN-${Date.now()}`,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      quantity_sold: quantity,
      sale_price: recipe.selling_price * quantity,
      timestamp: new Date().toISOString(),
      ingredients_deducted: recipe.ingredients.map(ing => ({
        ...ing,
        quantity_needed: ing.quantity_needed * quantity
      }))
    };

    // Save updates
    setIngredients(updatedIngredients);
    const updatedSales = [...sales, newSale];
    setSales(updatedSales);
    
    saveIngredientsToStorage(updatedIngredients);
    saveSalesToStorage(updatedSales);

    alert(`✅ Sale processed!\n${quantity}x ${recipe.name}\nTotal: $${(recipe.selling_price * quantity).toFixed(2)}\nIngredients automatically deducted from inventory.`);
  };

  // Create sample data for demonstration
  const createSampleData = () => {
    // Sample ingredients
    const sampleIngredientsData: Ingredient[] = [
      {
        id: 'schnitzel-1',
        name: 'Schnitzel',
        category_id: 'meats-seafood',
        category_name: 'Meats & Seafood',
        supplier: 'Local Supplier',
        type: 'Fresh',
        unit: 'pieces',
        cost_per_unit: 8.50,
        current_stock: 20,
        min_stock_level: 5,
        max_stock_level: 50,
        sku: 'MEAT-SCH-001',
        description: 'Fresh chicken schnitzel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_restocked: new Date().toISOString()
      },
      {
        id: 'potatoes-1',
        name: 'Potatoes',
        category_id: 'fruits-vegetables',
        category_name: 'Fruits & Vegetables',
        supplier: 'Local Supplier',
        type: 'Fresh',
        unit: 'g',
        cost_per_unit: 0.003,
        current_stock: 5000,
        min_stock_level: 1000,
        max_stock_level: 10000,
        sku: 'VEG-POT-001',
        description: 'Fresh potatoes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_restocked: new Date().toISOString()
      },
      {
        id: 'peas-carrots-1',
        name: 'Peas and Carrots',
        category_id: 'fruits-vegetables',
        category_name: 'Fruits & Vegetables',
        supplier: 'Local Supplier',
        type: 'Fresh',
        unit: 'g',
        cost_per_unit: 0.005,
        current_stock: 3000,
        min_stock_level: 500,
        max_stock_level: 5000,
        sku: 'VEG-PC-001',
        description: 'Fresh peas and carrots mix',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_restocked: new Date().toISOString()
      },
      {
        id: 'pumpkin-1',
        name: 'Pumpkin',
        category_id: 'fruits-vegetables',
        category_name: 'Fruits & Vegetables',
        supplier: 'Local Supplier',
        type: 'Fresh',
        unit: 'g',
        cost_per_unit: 0.004,
        current_stock: 2000,
        min_stock_level: 500,
        max_stock_level: 4000,
        sku: 'VEG-PUM-001',
        description: 'Fresh pumpkin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_restocked: new Date().toISOString()
      }
    ];

    // Sample Schnitzel recipe
    const sampleRecipe: Recipe = {
      id: 'recipe-schnitzel-meal',
      name: 'Schnitzel Meal',
      description: 'Classic schnitzel served with roasted potatoes and steamed vegetables',
      category: 'Main Course',
      selling_price: 18.50,
      preparation_time: 25,
      serving_size: 1,
      ingredients: [
        {
          ingredient_id: 'schnitzel-1',
          ingredient_name: 'Schnitzel',
          quantity_needed: 1,
          unit: 'pieces',
          cost: 8.50
        },
        {
          ingredient_id: 'potatoes-1',
          ingredient_name: 'Potatoes',
          quantity_needed: 200,
          unit: 'g',
          cost: 0.60
        },
        {
          ingredient_id: 'peas-carrots-1',
          ingredient_name: 'Peas and Carrots',
          quantity_needed: 100,
          unit: 'g',
          cost: 0.50
        },
        {
          ingredient_id: 'pumpkin-1',
          ingredient_name: 'Pumpkin',
          quantity_needed: 100,
          unit: 'g',
          cost: 0.40
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    // Update state and save to storage
    setIngredients(sampleIngredientsData);
    setRecipes([sampleRecipe]);
    
    saveIngredientsToStorage(sampleIngredientsData);
    saveRecipesToStorage([sampleRecipe]);

    alert('✅ Sample data created!\n- 4 ingredients added\n- Schnitzel Meal recipe created\n\nYou can now test POS integration by processing a sale!');
  };

  // Filter and search functionality
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = !searchTerm || 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory || ingredient.category_id === filterCategory;
    const matchesSupplier = !filterSupplier || ingredient.supplier === filterSupplier;
    
    let matchesStockLevel = true;
    if (filterStockLevel) {
      const level = getStockLevel(ingredient);
      matchesStockLevel = level === filterStockLevel;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStockLevel;
  });

  // Group ingredients by category
  const groupedIngredients = filteredIngredients.reduce((acc, ingredient) => {
    const category = ingredient.category_name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ingredient);
    return acc;
  }, {} as { [key: string]: Ingredient[] });

  const uniqueSuppliers = [...new Set(ingredients.map(ing => ing.supplier))];

  if (loading) {
    return (
      <div className="restaurant-inventory-container">
        <div className="loading-state">
          <RefreshCw className="spinning" size={24} />
          <p>Loading restaurant inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-inventory-container">
      <div className="restaurant-header">
        <div className="header-left">
          <h1>
            <ChefHat size={32} />
            Restaurant Inventory Management
          </h1>
          <p>Complete ingredient tracking with POS integration and recipe management</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={createSampleData}
            title="Create sample data for testing"
          >
            <ChefHat size={16} />
            Demo Data
          </button>
          <button 
            className="refresh-btn"
            onClick={loadData}
            title="Refresh data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={16} />
          Ingredients Inventory
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          <ChefHat size={16} />
          Recipe Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <Receipt size={16} />
          Sales & POS
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' && (
        <div className="inventory-content">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="search-section">
              <div className="search-input-container">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search ingredients, suppliers, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button 
                className={`filter-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                Filters
              </button>
            </div>
            
            <div className="view-actions">
              <div className="view-mode-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={16} />
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </button>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {ingredientCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Supplier</label>
                <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
                  <option value="">All Suppliers</option>
                  {uniqueSuppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Stock Level</label>
                <select value={filterStockLevel} onChange={(e) => setFilterStockLevel(e.target.value)}>
                  <option value="">All Levels</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="critical">Critical</option>
                  <option value="low">Low Stock</option>
                  <option value="good">Good Stock</option>
                  <option value="overstocked">Overstocked</option>
                </select>
              </div>
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setFilterCategory('');
                  setFilterSupplier('');
                  setFilterStockLevel('');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Stock Alerts Summary */}
          {ingredients.length > 0 && (
            <div className="stock-alerts-summary">
              <h3>
                <AlertCircle size={18} />
                Stock Alerts
              </h3>
              <div className="alert-stats">
                <div className="alert-stat critical">
                  <span className="count">{ingredients.filter(ing => getStockLevel(ing) === 'critical').length}</span>
                  <span className="label">Critical</span>
                </div>
                <div className="alert-stat low">
                  <span className="count">{ingredients.filter(ing => getStockLevel(ing) === 'low').length}</span>
                  <span className="label">Low Stock</span>
                </div>
                <div className="alert-stat out">
                  <span className="count">{ingredients.filter(ing => getStockLevel(ing) === 'out-of-stock').length}</span>
                  <span className="label">Out of Stock</span>
                </div>
                <div className="alert-stat good">
                  <span className="count">{ingredients.filter(ing => getStockLevel(ing) === 'good').length}</span>
                  <span className="label">Well Stocked</span>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients Display */}
          <div className="ingredients-section">
            {Object.keys(groupedIngredients).length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <h3>No Ingredients Yet</h3>
                <p>Add your first ingredient to get started with restaurant inventory management</p>
              </div>
            ) : (
              Object.entries(groupedIngredients).map(([categoryName, categoryIngredients]) => (
                <div key={categoryName} className="category-section">
                  <div className="category-header">
                    <h3>
                      {ingredientCategories.find(cat => cat.name === categoryName)?.icon || '📦'} 
                      {categoryName}
                    </h3>
                    <span className="ingredient-count">{categoryIngredients.length} ingredients</span>
                  </div>
                  
                  <div className={`ingredients-grid ${viewMode}`}>
                    {categoryIngredients.map(ingredient => (
                      <div key={ingredient.id} className="ingredient-card">
                        <div className="ingredient-header">
                          <div className="ingredient-name">
                            <Scale size={16} />
                            {ingredient.name}
                          </div>
                          <div className="ingredient-actions">
                            <button 
                              className="delete-btn"
                              onClick={() => {
                                if (confirm(`Delete ${ingredient.name}?`)) {
                                  const updated = ingredients.filter(ing => ing.id !== ingredient.id);
                                  setIngredients(updated);
                                  saveIngredientsToStorage(updated);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="ingredient-info">
                          <div className="ingredient-specs">
                            <div className="spec-item">
                              <Tag size={14} />
                              <span>{ingredient.type}</span>
                            </div>
                            <div className="spec-item">
                              <Package size={14} />
                              <span>{ingredient.supplier}</span>
                            </div>
                            {ingredient.expiry_date && (
                              <div className="spec-item">
                                <Clock size={14} />
                                <span>Exp: {new Date(ingredient.expiry_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ingredient-footer">
                          <div className="ingredient-cost">
                            <DollarSign size={16} />
                            <span>${ingredient.cost_per_unit.toFixed(2)}/{ingredient.unit}</span>
                          </div>
                          <div className="ingredient-stock-container">
                            <div 
                              className={`ingredient-stock stock-${getStockLevel(ingredient)}`}
                              style={{ color: getStockWarning(ingredient).color }}
                            >
                              <span className="stock-icon">{getStockWarning(ingredient).icon}</span>
                              <span>{getStockWarning(ingredient).message}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recipe Management Tab */}
      {activeTab === 'recipes' && (
        <div className="recipes-content">
          <div className="recipes-header">
            <h2>Recipe Management</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowRecipeForm(true)}
            >
              <Plus size={16} />
              Create Recipe
            </button>
          </div>

          <div className="recipes-grid">
            {recipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-header">
                  <h3>{recipe.name}</h3>
                  <span className="recipe-category">{recipe.category}</span>
                </div>
                <div className="recipe-info">
                  <p>{recipe.description}</p>
                  <div className="recipe-stats">
                    <div className="stat">
                      <Clock size={14} />
                      <span>{recipe.preparation_time} min</span>
                    </div>
                    <div className="stat">
                      <Utensils size={14} />
                      <span>{recipe.serving_size} serving{recipe.serving_size > 1 ? 's' : ''}</span>
                    </div>
                    <div className="stat">
                      <DollarSign size={14} />
                      <span>${recipe.selling_price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="recipe-ingredients">
                    <h4>Ingredients ({recipe.ingredients.length}):</h4>
                    <ul>
                      {recipe.ingredients.slice(0, 3).map(ing => (
                        <li key={ing.ingredient_id}>
                          {ing.quantity_needed}{ing.unit} {ing.ingredient_name}
                        </li>
                      ))}
                      {recipe.ingredients.length > 3 && (
                        <li>+ {recipe.ingredients.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="recipe-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const quantity = prompt('How many servings to prepare?', '1');
                      if (quantity && !isNaN(Number(quantity))) {
                        processSale(recipe.id, Number(quantity), 'Kitchen Prep');
                      }
                    }}
                  >
                    <Minus size={14} />
                    Use Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales & POS Tab */}
      {activeTab === 'sales' && (
        <div className="sales-content">
          <div className="sales-header">
            <h2>Sales & POS Integration</h2>
            <div className="pos-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (recipes.length === 0) {
                    alert('Please create recipes first!');
                    return;
                  }
                  const recipeOptions = recipes.map(r => `${r.name} - $${r.selling_price}`).join('\n');
                  const selection = prompt(`Select recipe to sell:\n${recipeOptions}\n\nEnter recipe name:`);
                  if (selection) {
                    const recipe = recipes.find(r => r.name.toLowerCase().includes(selection.toLowerCase()));
                    if (recipe) {
                      const quantity = prompt('Quantity:', '1');
                      if (quantity && !isNaN(Number(quantity))) {
                        processSale(recipe.id, Number(quantity), 'Manual Sale');
                      }
                    }
                  }
                }}
              >
                <Receipt size={16} />
                Process Sale
              </button>
            </div>
          </div>

          <div className="sales-summary">
            <div className="summary-card">
              <h3>Today's Sales</h3>
              <div className="summary-stat">
                <span className="value">{sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length}</span>
                <span className="label">Orders</span>
              </div>
            </div>
            <div className="summary-card">
              <h3>Revenue</h3>
              <div className="summary-stat">
                <span className="value">
                  ${sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString())
                    .reduce((sum, s) => sum + s.sale_price, 0).toFixed(2)}
                </span>
                <span className="label">Today</span>
              </div>
            </div>
          </div>

          <div className="recent-sales">
            <h3>Recent Sales</h3>
            <div className="sales-list">
              {sales.slice(-10).reverse().map(sale => (
                <div key={sale.id} className="sale-item">
                  <div className="sale-info">
                    <span className="sale-recipe">{sale.quantity_sold}x {sale.recipe_name}</span>
                    <span className="sale-time">{new Date(sale.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="sale-price">${sale.sale_price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Form */}
      {showRecipeForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="form-header">
              <h3>Create New Recipe</h3>
              <button onClick={() => setShowRecipeForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddRecipe}>
              <div className="form-section">
                <h4>Recipe Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Recipe Name *</label>
                    <input
                      type="text"
                      value={recipeForm.name || ''}
                      onChange={(e) => setRecipeForm({...recipeForm, name: e.target.value})}
                      placeholder="e.g., Schnitzel Meal"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={recipeForm.category || ''}
                      onChange={(e) => setRecipeForm({...recipeForm, category: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {recipeCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={recipeForm.description || ''}
                    onChange={(e) => setRecipeForm({...recipeForm, description: e.target.value})}
                    rows={3}
                    placeholder="Describe the recipe..."
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Selling Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={recipeForm.selling_price || ''}
                      onChange={(e) => setRecipeForm({...recipeForm, selling_price: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Preparation Time (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={recipeForm.preparation_time || ''}
                      onChange={(e) => setRecipeForm({...recipeForm, preparation_time: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Recipe Ingredients</h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Add ingredients needed for this recipe. The system will automatically deduct these from inventory when the item is sold.
                </p>
                
                {ingredients.length === 0 ? (
                  <div className="ingredient-help">
                    <AlertCircle size={16} />
                    <div>
                      <p><strong>No ingredients available!</strong></p>
                      <p>Please add ingredients to your inventory first before creating recipes.</p>
                    </div>
                  </div>
                ) : (
                  <div className="recipe-ingredients-form">
                    {recipeForm.ingredients?.map((ingredient, index) => (
                      <div key={index} className="recipe-ingredient-row">
                        <div className="form-group">
                          <label>Ingredient</label>
                          <select
                            value={ingredient.ingredient_id}
                            onChange={(e) => {
                              const selectedIngredient = ingredients.find(ing => ing.id === e.target.value);
                              if (selectedIngredient) {
                                const updatedIngredients = [...(recipeForm.ingredients || [])];
                                updatedIngredients[index] = {
                                  ...ingredient,
                                  ingredient_id: selectedIngredient.id,
                                  ingredient_name: selectedIngredient.name,
                                  unit: selectedIngredient.unit,
                                  cost: selectedIngredient.cost_per_unit
                                };
                                setRecipeForm({...recipeForm, ingredients: updatedIngredients});
                              }
                            }}
                          >
                            <option value="">Select Ingredient</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} (${ing.cost_per_unit.toFixed(2)}/{ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Quantity</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={ingredient.quantity_needed || ''}
                            onChange={(e) => {
                              const updatedIngredients = [...(recipeForm.ingredients || [])];
                              const quantity = parseFloat(e.target.value) || 0;
                              updatedIngredients[index] = {
                                ...ingredient,
                                quantity_needed: quantity,
                                cost: quantity * ingredient.cost
                              };
                              setRecipeForm({...recipeForm, ingredients: updatedIngredients});
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div className="form-group">
                          <label>Unit</label>
                          <input
                            type="text"
                            value={ingredient.unit || ''}
                            readOnly
                            style={{ background: '#f1f5f9', color: '#64748b' }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Cost</label>
                          <input
                            type="text"
                            value={`$${(ingredient.cost || 0).toFixed(2)}`}
                            readOnly
                            style={{ background: '#f1f5f9', color: '#64748b' }}
                          />
                        </div>
                        <div className="form-group">
                          <label>&nbsp;</label>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => {
                              const updatedIngredients = (recipeForm.ingredients || []).filter((_, i) => i !== index);
                              setRecipeForm({...recipeForm, ingredients: updatedIngredients});
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const newIngredient: RecipeIngredient = {
                          ingredient_id: '',
                          ingredient_name: '',
                          quantity_needed: 0,
                          unit: '',
                          cost: 0
                        };
                        setRecipeForm({
                          ...recipeForm,
                          ingredients: [...(recipeForm.ingredients || []), newIngredient]
                        });
                      }}
                      style={{ marginTop: '16px' }}
                    >
                      <Plus size={14} />
                      Add Ingredient
                    </button>
                  </div>
                )}
              </div>

              {recipeForm.ingredients && recipeForm.ingredients.length > 0 && (
                <div className="form-section">
                  <h4>Cost Summary</h4>
                  <div className="cost-summary">
                    <div className="cost-row">
                      <span>Total Ingredient Cost:</span>
                      <strong>${(recipeForm.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0)).toFixed(2)}</strong>
                    </div>
                    <div className="cost-row">
                      <span>Selling Price:</span>
                      <strong>${(recipeForm.selling_price || 0).toFixed(2)}</strong>
                    </div>
                    <div className="cost-row profit">
                      <span>Profit Margin:</span>
                      <strong>
                        ${((recipeForm.selling_price || 0) - (recipeForm.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0))).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowRecipeForm(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!recipeForm.name || !recipeForm.category || !recipeForm.ingredients?.length}
                >
                  Create Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ingredient Form */}
      {showAddForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="form-header">
              <h3>Add New Ingredient</h3>
              <button onClick={() => setShowAddForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddIngredient}>
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ingredient Name *</label>
                    <input
                      type="text"
                      value={ingredientForm.name || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, name: e.target.value})}
                      placeholder="e.g., Chicken Breast"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={ingredientForm.category_id || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, category_id: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {ingredientCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      value={ingredientForm.supplier || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, supplier: e.target.value})}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={ingredientForm.type || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      {ingredientTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Stock & Pricing</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      value={ingredientForm.unit || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, unit: e.target.value})}
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cost per Unit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ingredientForm.cost_per_unit || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, cost_per_unit: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Stock</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingredientForm.current_stock || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, current_stock: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Min Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingredientForm.min_stock_level || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, min_stock_level: parseFloat(e.target.value) || 5})}
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ingredientForm.max_stock_level || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, max_stock_level: parseFloat(e.target.value) || 100})}
                      placeholder="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={ingredientForm.expiry_date || ''}
                      onChange={(e) => setIngredientForm({...ingredientForm, expiry_date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Additional Details</h4>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={ingredientForm.description || ''}
                    onChange={(e) => setIngredientForm({...ingredientForm, description: e.target.value})}
                    rows={3}
                    placeholder="Additional details about the ingredient..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Ingredient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantInventory;