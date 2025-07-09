# Menu Data Import Guide

## Overview

The Menu Data Importer is a powerful feature that allows you to quickly populate your restaurant inventory system with professional-grade recipes, ingredients, and menu data. This comprehensive dataset includes 45+ restaurant recipes with detailed cost analysis, nutritional information, and cooking instructions.

## What's Included in the Dataset

### 📊 **Complete Recipe Database**
- **45+ Professional Recipes** across 8 categories
- **Detailed Cost Analysis** with profit margins
- **Nutritional Information** (calories, protein, carbs, fat, fiber)
- **Cooking Instructions** step-by-step
- **Ingredient Breakdowns** with quantities and costs
- **Dietary Information** (vegetarian, vegan, gluten-free)
- **Allergen Information** for safety compliance

### 🗂️ **Menu Categories**
- **Appetizers** 🥗 - Starters and small plates
- **Salads** 🥬 - Fresh garden salads and healthy options  
- **Soups** 🍲 - Hot and cold soups
- **Main Courses** 🍽️ - Hearty main dishes and entrees
- **Pasta & Italian** 🍝 - Traditional and modern pasta dishes
- **Seafood** 🐟 - Fresh fish and seafood specialties
- **Desserts** 🍰 - Sweet treats and desserts
- **Beverages** 🥤 - Hot and cold drinks

### 🥘 **Sample Recipes Included**
- **Classic Schnitzel Meal** - $18.50 (50% profit margin)
- **Caesar Salad** - $12.00 (62.5% profit margin)
- **Pasta Carbonara** - $16.50 (59.1% profit margin)
- **Grilled Salmon Fillet** - $22.00 (43.2% profit margin)
- **Chicken Parmesan** - $19.50 (55.1% profit margin)
- And 40+ more professional recipes!

## How to Import Menu Data

### Step 1: Access the Importer
1. Navigate to **"Menu Data Import"** in the sidebar
2. Click on the Database icon 🗄️ to access the importer

### Step 2: Load Dataset Preview
1. Click **"Load Menu Dataset"** button
2. Review the dataset preview showing:
   - Categories overview
   - Sample recipes with pricing
   - Import statistics

### Step 3: Import All Data
1. Review the preview data
2. Click **"Import All Data"** to proceed
3. Wait for the import process to complete

### Step 4: View Import Results
After successful import, you'll see:
- **Import Statistics**: Number of recipes, ingredients, and categories imported
- **Cost Analysis**: Total recipe costs and average profit margins
- **Next Steps**: Recommendations for optimizing your new data

## What Gets Imported

### 🧄 **Ingredients Database**
- **150+ Unique Ingredients** automatically created
- **Organized by Categories** (meats, vegetables, dairy, etc.)
- **Cost Information** per unit for accurate pricing
- **Default Stock Levels** set for immediate use
- **SKU Generation** for inventory tracking

### 📝 **Recipe Collection**
- **Complete Recipe Cards** with all details
- **Ingredient Lists** with exact quantities
- **Cost Calculations** for profit analysis
- **Cooking Instructions** step-by-step
- **Nutritional Data** for menu planning
- **Allergen Warnings** for safety compliance

### 🏷️ **Menu Categories**
- **Professional Structure** for menu organization
- **Icon Assignments** for visual identification
- **Category Descriptions** for clarity

## Integration with Restaurant Inventory

Once imported, the data seamlessly integrates with your restaurant system:

### ✅ **Restaurant Inventory Tab**
- All recipes appear in the **Recipe Management** section
- Ingredients are available in the **Ingredients Inventory**
- Categories are organized and ready for use

### ✅ **POS Integration Simulation**
- Test recipe costing with the **Sales & POS** tab
- Automatic inventory deduction when "selling" menu items
- Real-time profit calculation

### ✅ **AI Assistant Enhancement**
- AI can analyze your imported menu for optimization
- Smart recommendations based on recipe profitability
- Menu engineering insights using imported data

## Post-Import Customization

### 🔧 **Recommended Actions**
1. **Review Pricing** - Adjust menu prices for your market
2. **Update Stock Levels** - Set realistic inventory quantities
3. **Supplier Information** - Add your actual supplier contacts
4. **Seasonal Adjustments** - Modify recipes for seasonal availability
5. **Local Adaptation** - Adjust recipes for local tastes and regulations

### 📊 **Using the Data for Analysis**
- **Profit Margin Analysis** - Identify most profitable items
- **Cost Optimization** - Find opportunities to reduce ingredient costs
- **Menu Engineering** - Balance high-profit with popular items
- **Inventory Planning** - Use consumption data for smarter ordering

## Export and Backup

### 💾 **Data Export**
- Click **"Export Current Data"** to backup your complete dataset
- Includes all imported recipes, ingredients, and categories
- JSON format for easy re-import or external use

### 🔄 **Re-importing**
- You can import multiple times to add more recipes
- Duplicate items are automatically handled
- Version tracking maintains data integrity

## Technical Details

### 📁 **File Formats Supported**
- **JSON** - Complete structured data with all details
- **CSV** - Simplified tabular format for spreadsheet compatibility

### 🗂️ **Data Structure**
```json
{
  "metadata": {
    "version": "1.0",
    "total_recipes": 45,
    "categories": 8
  },
  "categories": [...],
  "recipes": [
    {
      "id": "recipe-id",
      "name": "Recipe Name",
      "price": 18.50,
      "cost_to_make": 9.25,
      "profit_margin": 50.0,
      "ingredients": [...],
      "instructions": [...],
      "nutrition": {...}
    }
  ]
}
```

## Troubleshooting

### ❌ **Common Issues**
- **File Not Found**: Ensure the dataset files are in `/public/sample_data/`
- **Import Failed**: Check browser console for detailed error messages
- **Duplicate Data**: Clear existing data before re-importing if needed

### 🔧 **Support**
- Check the AI Assistant for menu optimization insights
- Export your data before making major changes
- Use the Restaurant Inventory interface to verify imported data

## Benefits of Using the Dataset

### 🚀 **Immediate Value**
- **Skip Manual Entry** - 45+ recipes imported instantly
- **Professional Quality** - Restaurant-grade recipes and costing
- **Complete System** - Ready-to-use inventory and menu management
- **Learning Tool** - Understand proper recipe costing and menu engineering

### 📈 **Long-term Advantages**
- **Foundation for Growth** - Expandable database structure
- **Cost Accuracy** - Precise ingredient costing for profitable operations
- **Menu Optimization** - Data-driven insights for better profitability
- **Training Resource** - Staff can learn from professional recipes

---

**Ready to transform your restaurant inventory system?** Navigate to the Menu Data Import page and start importing professional-grade menu data in minutes! 🚀