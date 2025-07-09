import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  DollarSign, 
  Clock, 
  Utensils, 
  Leaf, 
  Wheat, 
  TrendingUp,
  ChefHat,
  Heart,
  Info
} from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  category_id: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  difficulty: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  price: number;
  cost_to_make: number;
  profit_margin: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  instructions?: string;
  ingredients?: Ingredient[];
}

interface Ingredient {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  category: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Analytics {
  total_recipes: number;
  average_profit_margin: number;
  dietary_options: {
    vegetarian: number;
    vegan: number;
    gluten_free: number;
  };
}

const RestaurantMenu: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_recipes: 0,
    average_profit_margin: 0,
    dietary_options: { vegetarian: 0, vegan: 0, gluten_free: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Fetch menu data
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [recipesRes, categoriesRes, analyticsRes] = await Promise.all([
          fetch('/api/menu/recipes'),
          fetch('/api/menu/categories'),
          fetch('/api/menu/analytics')
        ]);

        if (recipesRes.ok) {
          const recipesData = await recipesRes.json();
          setRecipes(recipesData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }

      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Filter recipes based on category and search term
  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'all' || recipe.category_id === selectedCategory;
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get recipe details with ingredients
  const fetchRecipeDetails = async (recipeId: string) => {
    try {
      const response = await fetch(`/api/menu/recipe/${recipeId}`);
      if (response.ok) {
        const recipeDetails = await response.json();
        setSelectedRecipe(recipeDetails);
      }
    } catch (error) {
      console.error('Error loading recipe details:', error);
    }
  };

  const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => fetchRecipeDetails(recipe.id)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{recipe.name}</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">${recipe.price}</div>
            <div className="text-sm text-gray-500">
              {recipe.profit_margin && `${recipe.profit_margin.toFixed(1)}% margin`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.is_vegetarian && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Leaf className="w-3 h-3 mr-1" />
              Vegetarian
            </Badge>
          )}
          {recipe.is_vegan && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Heart className="w-3 h-3 mr-1" />
              Vegan
            </Badge>
          )}
          {recipe.is_gluten_free && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Wheat className="w-3 h-3 mr-1" />
              Gluten-Free
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}min
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {recipe.difficulty}
          </Badge>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{recipe.calories} cal</span>
          <span>Cost: ${recipe.cost_to_make}</span>
        </div>
      </CardContent>
    </Card>
  );

  const RecipeDetailModal: React.FC<{ recipe: Recipe | null; onClose: () => void }> = ({ recipe, onClose }) => {
    if (!recipe) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{recipe.name}</h2>
              <Button variant="outline" onClick={onClose}>
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recipe Info */}
              <div>
                <p className="text-gray-600 mb-4">{recipe.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-semibold">${recipe.price}</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    <span>{recipe.profit_margin?.toFixed(1)}% margin</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-600" />
                    <span>{recipe.prep_time_minutes + recipe.cook_time_minutes}min total</span>
                  </div>
                  <div className="flex items-center">
                    <Utensils className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                </div>

                {/* Nutritional Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2">Nutritional Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Calories: {recipe.calories}</div>
                    <div>Protein: {recipe.protein_g}g</div>
                    <div>Carbs: {recipe.carbs_g}g</div>
                    <div>Fat: {recipe.fat_g}g</div>
                    <div>Fiber: {recipe.fiber_g}g</div>
                  </div>
                </div>

                {/* Instructions */}
                {recipe.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2">Instructions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                      {recipe.instructions.split('\n').map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold mb-3">Ingredients</h4>
                <div className="space-y-2">
                  {recipe.ingredients?.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{ingredient.ingredient_name}</div>
                        <div className="text-xs text-gray-500">{ingredient.category}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{ingredient.quantity} {ingredient.unit}</div>
                        <div className="text-gray-500">${ingredient.total_cost?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${recipe.cost_to_make}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Selling Price:</span>
                    <span>${recipe.price}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-600">
                    <span>Profit:</span>
                    <span>${(recipe.price - recipe.cost_to_make).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <Utensils className="mr-3" />
          Restaurant Menu
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.total_recipes || 0}</div>
            <div className="text-sm opacity-90">Total Recipes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.average_profit_margin?.toFixed(1) || 0}%</div>
            <div className="text-sm opacity-90">Avg Profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.dietary_options?.vegetarian || 0}</div>
            <div className="text-sm opacity-90">Vegetarian</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.dietary_options?.gluten_free || 0}</div>
            <div className="text-sm opacity-90">Gluten-Free</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => fetch('/api/menu/import-dataset', { method: 'POST' })}
          variant="outline"
          className="whitespace-nowrap"
        >
          <Info className="w-4 h-4 mr-2" />
          Import Menu Data
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.icon} {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No recipes found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  );
};

export default RestaurantMenu;