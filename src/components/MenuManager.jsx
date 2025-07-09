import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  ChefHat,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Leaf,
  Upload,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  Utensils,
  Star
} from 'lucide-react';

const MenuManager = () => {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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

  const fetchRecipeDetails = async (recipeId) => {
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

  const getDietaryIcons = (recipe) => {
    const icons = [];
    if (recipe.is_vegetarian) icons.push(<Leaf key="veg" className="w-4 h-4 text-green-500" title="Vegetarian" />);
    if (recipe.is_vegan) icons.push(<Leaf key="vegan" className="w-4 h-4 text-green-600" title="Vegan" />);
    if (recipe.is_gluten_free) icons.push(<span key="gf" className="text-xs text-blue-500 font-bold" title="Gluten Free">GF</span>);
    return icons;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu and recipes</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchMenuData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={importMenuDataset}
            disabled={importing}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? 'Importing...' : 'Import Dataset'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Recipes</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_recipes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.avg_price?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avg_profit_margin?.toFixed(1) || '0.0'}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Leaf className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vegetarian Options</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.dietary_distribution?.vegetarian || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search recipes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
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
            </CardContent>
          </Card>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <div className="flex gap-1">
                      {getDietaryIcons(recipe)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge className={getDifficultyColor(recipe.difficulty)}>
                      {recipe.difficulty}
                    </Badge>
                    <span className="text-2xl font-bold text-green-600">
                      ${recipe.price?.toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
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

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => fetchRecipeDetails(recipe.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecipes.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                <p className="text-gray-600">
                  {recipes.length === 0 
                    ? "Import the menu dataset to get started" 
                    : "Try adjusting your search or filter criteria"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dietary Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="w-5 h-5 mr-2" />
                  Dietary Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Vegetarian</span>
                    <Badge variant="secondary">
                      {analytics.dietary_distribution?.vegetarian || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Vegan</span>
                    <Badge variant="secondary">
                      {analytics.dietary_distribution?.vegan || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Gluten-Free</span>
                    <Badge variant="secondary">
                      {analytics.dietary_distribution?.gluten_free || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Recipe Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Easy</span>
                    <Badge className="bg-green-100 text-green-800">
                      {analytics.difficulty_distribution?.easy || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {analytics.difficulty_distribution?.medium || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Hard</span>
                    <Badge className="bg-red-100 text-red-800">
                      {analytics.difficulty_distribution?.hard || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recipe Info */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                      {selectedRecipe.difficulty}
                    </Badge>
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