import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Leaf,
  Upload,
  RefreshCw,
  Search,
  BarChart3,
  X,
  AlertCircle
} from 'lucide-react';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Type definitions
interface MenuIngredient {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  category: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  serving_size: number;
  difficulty: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string[];
  price: number;
  cost_to_make: number;
  profit_margin: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients?: MenuIngredient[];
  instructions?: string[];
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface MenuAnalytics {
  total_recipes: number;
  avg_price: number;
  avg_profit_margin: number;
  avg_cost: number;
  total_revenue_potential: number;
  total_cost: number;
  categories: Record<string, number>;
  dietary_distribution: {
    vegetarian: number;
    vegan: number;
    gluten_free: number;
  };
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const MenuManager: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<MenuAnalytics>({
    total_recipes: 0,
    avg_price: 0,
    avg_profit_margin: 0,
    avg_cost: 0,
    total_revenue_potential: 0,
    total_cost: 0,
    categories: {},
    dietary_distribution: { vegetarian: 0, vegan: 0, gluten_free: 0 },
    difficulty_distribution: { easy: 0, medium: 0, hard: 0 }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState('recipes');

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [recipesRes, categoriesRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/menu/recipes`),
        fetch(`${API_BASE_URL}/api/menu/categories`),
        fetch(`${API_BASE_URL}/api/menu/analytics`)
      ]);

      if (recipesRes.ok) {
        setRecipes(await recipesRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      setError('Failed to fetch menu data');
      console.error('Menu data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const importMenuDataset = async () => {
    try {
      setImporting(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/api/menu/import-dataset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Import successful:', result);
        await fetchMenuData(); // Refresh data
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to import menu dataset');
      }
    } catch (err) {
      setError('Error importing menu dataset');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const fetchRecipeDetails = async (recipeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/recipe/${recipeId}`);
      if (response.ok) {
        const recipe = await response.json();
        setSelectedRecipe(recipe);
      }
    } catch (err) {
      console.error('Error fetching recipe details:', err);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDietaryIcons = (recipe: Recipe) => {
    const icons = [];
    if (recipe.is_vegetarian) icons.push(<Leaf key="veg" className="w-4 h-4 text-green-500" />);
    if (recipe.is_vegan) icons.push(<Leaf key="vegan" className="w-4 h-4 text-green-600" />);
    if (recipe.is_gluten_free) icons.push(<span key="gf" className="text-xs text-blue-500 font-bold" title="Gluten Free">GF</span>);
    return icons;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChefHat className="mr-3 text-blue-600" />
            Menu Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your restaurant menu and recipes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMenuData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={importMenuDataset}
            disabled={importing}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import Dataset'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <ChefHat className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recipes</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_recipes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Price</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.avg_price?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avg_profit_margin?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vegetarian Options</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.dietary_distribution?.vegetarian || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['recipes', 'categories', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'recipes' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search recipes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recipes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{recipe.name}</h3>
                      <div className="flex gap-1">
                        {getDietaryIcons(recipe)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2 py-1 text-xs rounded-md border ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ${recipe.price?.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {recipe.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {recipe.serving_size} serving
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Cost: ${recipe.cost_to_make?.toFixed(2)}</span>
                        <span className="text-green-600 font-medium">
                          {recipe.profit_margin?.toFixed(1)}% margin
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        {recipe.calories} cal | {recipe.protein_g}g protein
                      </div>
                    </div>

                    <button
                      onClick={() => fetchRecipeDetails(recipe.id)}
                      className="w-full mt-4 px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {filteredRecipes.length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                  <p className="text-gray-600">
                    {recipes.length === 0 
                      ? "Import the menu dataset to get started" 
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {analytics.categories?.[category.id] || 0} recipes
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dietary Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2" />
                  Dietary Options
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Vegetarian</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {analytics.dietary_distribution?.vegetarian || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vegan</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {analytics.dietary_distribution?.vegan || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gluten-Free</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {analytics.dietary_distribution?.gluten_free || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Recipe Difficulty
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Easy</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {analytics.difficulty_distribution?.easy || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      {analytics.difficulty_distribution?.medium || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hard</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {analytics.difficulty_distribution?.hard || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="lg:col-span-2 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Revenue Potential</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${analytics.total_revenue_potential?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${analytics.total_cost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average Cost per Recipe</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${analytics.avg_cost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
                  <p className="text-gray-600">{selectedRecipe.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recipe Info */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 text-xs rounded-md border ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                      {selectedRecipe.difficulty}
                    </span>
                    {getDietaryIcons(selectedRecipe).map((icon, i) => (
                      <span key={i}>{icon}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Prep Time:</span> {selectedRecipe.prep_time_minutes} min
                    </div>
                    <div>
                      <span className="font-medium">Cook Time:</span> {selectedRecipe.cook_time_minutes} min
                    </div>
                    <div>
                      <span className="font-medium">Servings:</span> {selectedRecipe.serving_size}
                    </div>
                    <div>
                      <span className="font-medium">Calories:</span> {selectedRecipe.calories}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-bold text-green-600">${selectedRecipe.price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cost to Make</p>
                      <p className="text-lg font-bold text-red-600">${selectedRecipe.cost_to_make}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-lg font-bold text-blue-600">{selectedRecipe.profit_margin}%</p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {selectedRecipe.instructions?.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients?.map((ingredient, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{ingredient.name}</span>
                          <p className="text-sm text-gray-600">
                            {ingredient.quantity} {ingredient.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${ingredient.total_cost.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            ${ingredient.cost_per_unit.toFixed(3)}/{ingredient.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;