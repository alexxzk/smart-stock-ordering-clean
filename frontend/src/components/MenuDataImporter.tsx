import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  Database,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  ChefHat,
  BarChart3
} from 'lucide-react';
import './MenuDataImporter.css';

interface MenuMetadata {
  version: string;
  last_updated: string;
  total_recipes: number;
  categories: number;
  description: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface RecipeIngredient {
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
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
}

interface MenuDataset {
  metadata: MenuMetadata;
  categories: MenuCategory[];
  recipes: Recipe[];
}

interface ImportStats {
  recipesImported: number;
  ingredientsCreated: number;
  categoriesCreated: number;
  totalCost: number;
  avgProfitMargin: number;
}

const MenuDataImporter: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [menuData, setMenuData] = useState<MenuDataset | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const loadMenuDataset = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch the menu dataset from the public folder or API
      const response = await fetch('/sample_data/restaurant_menu_dataset.json');
      if (!response.ok) {
        throw new Error('Failed to fetch menu dataset');
      }
      
      const data: MenuDataset = await response.json();
      setMenuData(data);
      setPreviewMode(true);
      
    } catch (err) {
      console.error('Error loading menu dataset:', err);
      setError('Failed to load menu dataset. Please check if the file exists.');
    } finally {
      setIsLoading(false);
    }
  };

  const importMenuData = async () => {
    if (!menuData) {
      setError('No menu data to import');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Import categories first
      let categoriesCreated = 0;
      for (const category of menuData.categories) {
        const categoryData = {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          type: 'menu-category'
        };
        
        // Store in localStorage for demo (in real app, would use API)
        const existingCategories = JSON.parse(localStorage.getItem('restaurant_menu_categories') || '[]');
        if (!existingCategories.find((c: any) => c.id === category.id)) {
          existingCategories.push(categoryData);
          localStorage.setItem('restaurant_menu_categories', JSON.stringify(existingCategories));
          categoriesCreated++;
        }
      }

      // Import ingredients from recipes
      const allIngredients: any[] = [];
      const ingredientMap = new Map();

      menuData.recipes.forEach(recipe => {
        recipe.ingredients.forEach(ingredient => {
          if (!ingredientMap.has(ingredient.ingredient_id)) {
            const ingredientData = {
              id: ingredient.ingredient_id,
              name: ingredient.name,
              category_id: ingredient.category,
              category_name: ingredient.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              supplier: 'Menu Dataset Import',
              type: 'Fresh',
              unit: ingredient.unit,
              cost_per_unit: ingredient.cost_per_unit,
              current_stock: 100, // Default stock level
              min_stock_level: 10,
              max_stock_level: 500,
              sku: `ING-${ingredient.ingredient_id.toUpperCase()}`,
              description: `Imported from menu dataset for ${recipe.name}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_restocked: new Date().toISOString()
            };
            
            allIngredients.push(ingredientData);
            ingredientMap.set(ingredient.ingredient_id, ingredientData);
          }
        });
      });

      // Save ingredients to localStorage
      const existingIngredients = JSON.parse(localStorage.getItem('restaurant_ingredients') || '{"ingredients": []}');
      existingIngredients.ingredients = [...existingIngredients.ingredients, ...allIngredients];
      existingIngredients.lastSaved = new Date().toISOString();
      existingIngredients.version = '2.0';
      localStorage.setItem('restaurant_ingredients', JSON.stringify(existingIngredients));

      // Import recipes
      const recipesToImport = menuData.recipes.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        selling_price: recipe.price,
        preparation_time: recipe.prep_time_minutes + recipe.cook_time_minutes,
        serving_size: recipe.serving_size,
        ingredients: recipe.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.name,
          quantity_needed: ing.quantity,
          unit: ing.unit,
          cost: ing.total_cost
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        // Additional data from dataset
        difficulty: recipe.difficulty,
        is_vegetarian: recipe.is_vegetarian,
        is_vegan: recipe.is_vegan,
        is_gluten_free: recipe.is_gluten_free,
        allergens: recipe.allergens,
        cost_to_make: recipe.cost_to_make,
        profit_margin: recipe.profit_margin,
        calories: recipe.calories,
        nutrition: {
          protein_g: recipe.protein_g,
          carbs_g: recipe.carbs_g,
          fat_g: recipe.fat_g,
          fiber_g: recipe.fiber_g
        },
        instructions: recipe.instructions,
        tags: recipe.tags
      }));

      // Save recipes to localStorage
      const existingRecipes = JSON.parse(localStorage.getItem('restaurant_recipes') || '{"recipes": []}');
      existingRecipes.recipes = [...existingRecipes.recipes, ...recipesToImport];
      existingRecipes.lastSaved = new Date().toISOString();
      existingRecipes.version = '2.0';
      localStorage.setItem('restaurant_recipes', JSON.stringify(existingRecipes));

      // Calculate import statistics
      const totalCost = menuData.recipes.reduce((sum, recipe) => sum + recipe.cost_to_make, 0);
      const avgProfitMargin = menuData.recipes.reduce((sum, recipe) => sum + recipe.profit_margin, 0) / menuData.recipes.length;

      const stats: ImportStats = {
        recipesImported: recipesToImport.length,
        ingredientsCreated: allIngredients.length,
        categoriesCreated: categoriesCreated,
        totalCost: totalCost,
        avgProfitMargin: avgProfitMargin
      };

      setImportStats(stats);
      setImportComplete(true);
      setPreviewMode(false);

    } catch (err) {
      console.error('Error importing menu data:', err);
      setError('Failed to import menu data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setImportComplete(false);
    setError(null);
    setImportStats(null);
    setMenuData(null);
    setPreviewMode(false);
  };

  const exportCurrentData = () => {
    try {
      const ingredients = JSON.parse(localStorage.getItem('restaurant_ingredients') || '{"ingredients": []}');
      const recipes = JSON.parse(localStorage.getItem('restaurant_recipes') || '{"recipes": []}');
      const categories = JSON.parse(localStorage.getItem('restaurant_menu_categories') || '[]');

      const exportData = {
        timestamp: new Date().toISOString(),
        ingredients: ingredients.ingredients || [],
        recipes: recipes.recipes || [],
        categories: categories
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurant_data_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  return (
    <div className="menu-importer-container">
      <div className="importer-header">
        <div className="header-left">
          <h2>
            <Database size={28} />
            Menu Data Importer
          </h2>
          <p>Import comprehensive restaurant menu data with recipes, ingredients, and nutritional information</p>
        </div>
        <div className="header-actions">
          <button onClick={exportCurrentData} className="btn btn-secondary">
            <Download size={16} />
            Export Current Data
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {!menuData && !importComplete && (
        <div className="import-card">
          <div className="import-intro">
            <ChefHat size={48} className="intro-icon" />
            <h3>Restaurant Menu Dataset</h3>
            <p>
              Import a comprehensive dataset containing 45+ professional recipes with detailed ingredient breakdowns,
              cost analysis, nutritional information, and cooking instructions.
            </p>
            <div className="dataset-features">
              <div className="feature-item">
                <FileText size={16} />
                <span>45+ Professional Recipes</span>
              </div>
              <div className="feature-item">
                <BarChart3 size={16} />
                <span>Cost & Profit Analysis</span>
              </div>
              <div className="feature-item">
                <Database size={16} />
                <span>Complete Ingredient Database</span>
              </div>
            </div>
          </div>
          
          <div className="import-actions">
            <button 
              onClick={loadMenuDataset} 
              disabled={isLoading}
              className="btn btn-primary btn-large"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="spinning" />
                  Loading Dataset...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Load Menu Dataset
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {previewMode && menuData && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>Dataset Preview</h3>
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-value">{menuData.metadata.total_recipes}</span>
                <span className="stat-label">Recipes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{menuData.categories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{menuData.metadata.version}</span>
                <span className="stat-label">Version</span>
              </div>
            </div>
          </div>

          <div className="preview-content">
            <div className="categories-preview">
              <h4>Categories</h4>
              <div className="categories-grid">
                {menuData.categories.map(category => (
                  <div key={category.id} className="category-preview-card">
                    <span className="category-icon">{category.icon}</span>
                    <div>
                      <div className="category-name">{category.name}</div>
                      <div className="category-desc">{category.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="recipes-preview">
              <h4>Sample Recipes</h4>
              <div className="recipes-grid">
                {menuData.recipes.slice(0, 6).map(recipe => (
                  <div key={recipe.id} className="recipe-preview-card">
                    <div className="recipe-header">
                      <h5>{recipe.name}</h5>
                      <span className="recipe-price">${recipe.price.toFixed(2)}</span>
                    </div>
                    <p className="recipe-description">{recipe.description}</p>
                    <div className="recipe-meta">
                      <span className="recipe-time">{recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
                      <span className="recipe-difficulty">{recipe.difficulty}</span>
                      <span className="recipe-profit">{recipe.profit_margin.toFixed(1)}% profit</span>
                    </div>
                    <div className="recipe-ingredients-count">
                      {recipe.ingredients.length} ingredients
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="preview-actions">
            <button onClick={resetImport} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              onClick={importMenuData}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="spinning" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Import All Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {importComplete && importStats && (
        <div className="import-success">
          <div className="success-header">
            <CheckCircle size={48} className="success-icon" />
            <h3>Import Successful!</h3>
            <p>Menu data has been successfully imported into your restaurant inventory system.</p>
          </div>

          <div className="import-stats">
            <div className="stat-card">
              <div className="stat-value">{importStats.recipesImported}</div>
              <div className="stat-label">Recipes Imported</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{importStats.ingredientsCreated}</div>
              <div className="stat-label">Ingredients Created</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{importStats.categoriesCreated}</div>
              <div className="stat-label">Categories Added</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${importStats.totalCost.toFixed(2)}</div>
              <div className="stat-label">Total Recipe Costs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{importStats.avgProfitMargin.toFixed(1)}%</div>
              <div className="stat-label">Avg Profit Margin</div>
            </div>
          </div>

          <div className="next-steps">
            <h4>Next Steps</h4>
            <ul>
              <li>Review imported recipes in the Restaurant Inventory section</li>
              <li>Adjust ingredient stock levels as needed</li>
              <li>Customize pricing and profit margins</li>
              <li>Set up supplier information for ingredients</li>
              <li>Use the AI Assistant for menu optimization insights</li>
            </ul>
          </div>

          <div className="success-actions">
            <button onClick={resetImport} className="btn btn-secondary">
              <RefreshCw size={16} />
              Import More Data
            </button>
            <button 
              onClick={() => window.location.href = '/restaurant-inventory'}
              className="btn btn-primary"
            >
              <ChefHat size={16} />
              View Restaurant Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuDataImporter;