import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChefHat, 
  DollarSign, 
  Clock, 
  Users,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Download,
  Upload,
  BarChart3,
  Leaf,
  AlertCircle,
  Star
} from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  recipe_count: number;
}

interface MenuRecipe {
  id: string;
  name: string;
  category: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  allergens: string;
  price: number;
  cost_to_make: number;
  profit_margin: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  tags: string;
  ingredients_summary?: string;
}

interface RecipeDetail extends MenuRecipe {
  ingredients: Array<{
    ingredient_name: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    total_cost: number;
    category: string;
  }>;
  instructions?: string;
}

interface ProfitabilityData {
  categories: Array<{
    category: string;
    recipe_count: number;
    avg_price: number;
    avg_cost: number;
    avg_profit_margin: number;
    min_profit_margin: number;
    max_profit_margin: number;
  }>;
}

const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [recipes, setRecipes] = useState<MenuRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<MenuRecipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [profitabilityData, setProfitabilityData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'analytics' | 'import'>('recipes');
  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => {
    loadMenuData();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, selectedCategory, searchTerm]);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      // Load categories
      const categoriesResponse = await fetch('/api/menu/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Load recipes
      const recipesResponse = await fetch('/api/menu/recipes');
      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        setRecipes(recipesData);
      }

      // Load profitability data
      const profitabilityResponse = await fetch('/api/menu/profitability');
      if (profitabilityResponse.ok) {
        const profitabilityData = await profitabilityResponse.json();
        setProfitabilityData(profitabilityData);
      }

    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (selectedCategory) {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.name.toLowerCase().includes(term) ||
        recipe.description.toLowerCase().includes(term) ||
        recipe.tags.toLowerCase().includes(term)
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleImportDataset = async () => {
    setLoading(true);
    setImportStatus('Importing menu dataset...');
    
    try {
      const response = await fetch('/api/menu/import-dataset', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        setImportStatus(`✅ ${result.message}`);
        await loadMenuData();
      } else {
        const error = await response.json();
        setImportStatus(`❌ Import failed: ${error.error}`);
      }
    } catch (error) {
      setImportStatus(`❌ Import failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const viewRecipeDetails = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/menu/recipe/${recipeId}`);
      if (response.ok) {
        const recipeDetail = await response.json();
        setSelectedRecipe(recipeDetail);
      }
    } catch (error) {
      console.error('Error loading recipe details:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProfitabilityColor = (margin: number) => {
    if (margin >= 60) return 'text-green-600';
    if (margin >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600">Comprehensive menu dataset with recipes, costs, and analytics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'recipes', label: 'Recipes & Menu', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'import', label: 'Import Data', icon: Upload }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Categories Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-sm text-gray-500">{category.recipe_count} recipes</span>
                </div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Recipe Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  {/* Recipe Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{recipe.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </span>
                  </div>

                  {/* Recipe Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {recipe.prep_time_minutes + recipe.cook_time_minutes}min
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {recipe.calories} cal
                    </div>
                  </div>

                  {/* Dietary Badges */}
                  <div className="flex gap-1 mb-3">
                    {recipe.is_vegetarian && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        🌱 Vegetarian
                      </span>
                    )}
                    {recipe.is_vegan && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        🌿 Vegan
                      </span>
                    )}
                    {recipe.is_gluten_free && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        🌾 Gluten-Free
                      </span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(recipe.price)}
                      </span>
                      <div className="text-sm">
                        <div className="text-gray-500">Cost: {formatCurrency(recipe.cost_to_make)}</div>
                        <div className={`font-medium ${getProfitabilityColor(recipe.profit_margin)}`}>
                          {recipe.profit_margin.toFixed(1)}% profit
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => viewRecipeDetails(recipe.id)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRecipes.length === 0 && !loading && (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recipes found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && profitabilityData && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{recipes.length}</p>
                  <p className="text-sm text-gray-600">Total Recipes</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(recipes.reduce((sum, r) => sum + r.price, 0) / recipes.length)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Price</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(recipes.reduce((sum, r) => sum + r.profit_margin, 0) / recipes.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Profit</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <Leaf className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {recipes.filter(r => r.is_vegetarian).length}
                  </p>
                  <p className="text-sm text-gray-600">Vegetarian</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Profitability */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Category Profitability Analysis</h2>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-500">
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Recipes</th>
                      <th className="pb-2">Avg Price</th>
                      <th className="pb-2">Avg Cost</th>
                      <th className="pb-2">Profit Margin</th>
                      <th className="pb-2">Range</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {profitabilityData.categories.map(category => (
                      <tr key={category.category} className="border-t">
                        <td className="py-3 font-medium">{category.category}</td>
                        <td className="py-3">{category.recipe_count}</td>
                        <td className="py-3">{formatCurrency(category.avg_price)}</td>
                        <td className="py-3">{formatCurrency(category.avg_cost)}</td>
                        <td className={`py-3 font-medium ${getProfitabilityColor(category.avg_profit_margin)}`}>
                          {category.avg_profit_margin.toFixed(1)}%
                        </td>
                        <td className="py-3 text-gray-500">
                          {category.min_profit_margin.toFixed(1)}% - {category.max_profit_margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Menu Dataset</h2>
            <p className="text-gray-600 mb-6">
              Import the comprehensive restaurant menu dataset including 45+ recipes, detailed ingredients, 
              costs, nutritional information, and profitability data.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleImportDataset}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload className="h-5 w-5 mr-2" />
                {loading ? 'Importing...' : 'Import Menu Dataset'}
              </button>
              
              {importStatus && (
                <div className={`p-4 rounded-lg ${
                  importStatus.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Dataset Includes:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 45+ complete recipes across 8 categories</li>
                <li>• Detailed ingredient lists with costs</li>
                <li>• Nutritional information (calories, macros)</li>
                <li>• Profitability analysis and pricing data</li>
                <li>• Dietary filters (vegetarian, vegan, gluten-free)</li>
                <li>• Preparation times and difficulty levels</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRecipe.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedRecipe.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recipe Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Recipe Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Prep Time:</span>
                        <span className="ml-2 font-medium">{selectedRecipe.prep_time_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cook Time:</span>
                        <span className="ml-2 font-medium">{selectedRecipe.cook_time_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulty:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                          {selectedRecipe.difficulty}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Calories:</span>
                        <span className="ml-2 font-medium">{selectedRecipe.calories}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Pricing & Profitability</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Selling Price:</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedRecipe.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cost to Make:</span>
                        <span>{formatCurrency(selectedRecipe.cost_to_make)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Profit Margin:</span>
                        <span className={`font-bold ${getProfitabilityColor(selectedRecipe.profit_margin)}`}>
                          {selectedRecipe.profit_margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Nutrition (per serving)</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Protein:</span>
                        <span>{selectedRecipe.protein_g}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Carbs:</span>
                        <span>{selectedRecipe.carbs_g}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fat:</span>
                        <span>{selectedRecipe.fat_g}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fiber:</span>
                        <span>{selectedRecipe.fiber_g}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Ingredients</h3>
                    <div className="space-y-2">
                      {selectedRecipe.ingredients?.map((ingredient, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{ingredient.ingredient_name}</div>
                            <div className="text-sm text-gray-500">
                              {ingredient.quantity} {ingredient.unit} • {ingredient.category}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(ingredient.total_cost)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Loading menu data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;