import { useState } from 'react'
import { 
  Database, 
  Upload, 
  Download, 
  FileText, 
  DollarSign, 
  List,
  ChefHat 
} from 'lucide-react'

export default function MenuDataImporter() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadDataset = async () => {
    setIsLoading(true)
    // TODO: Implement dataset loading logic
    setTimeout(() => {
      setIsLoading(false)
      alert('Menu dataset loaded successfully!')
    }, 2000)
  }

  const handleExportData = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!')
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Purple Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Menu Data Importer</h1>
              <p className="text-purple-100 mt-2">
                Import comprehensive restaurant menu data with recipes, ingredients, and nutritional information
              </p>
            </div>
          </div>
          <button
            onClick={handleExportData}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export Current Data</span>
          </button>
        </div>
      </div>

      {/* Menu Dataset Section */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Restaurant Menu Dataset</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Import a comprehensive dataset containing 45+ professional recipes with detailed 
            ingredient breakdowns, cost analysis, nutritional information, and cooking instructions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">45+ Professional Recipes</h3>
            <p className="text-gray-600">
              Curated collection of restaurant-quality recipes with detailed instructions
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cost & Profit Analysis</h3>
            <p className="text-gray-600">
              Detailed cost breakdowns and profit margin calculations for each recipe
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Ingredient Database</h3>
            <p className="text-gray-600">
              Comprehensive ingredient database with nutritional information and supplier data
            </p>
          </div>
        </div>

        {/* Load Dataset Button */}
        <div className="text-center">
          <button
            onClick={handleLoadDataset}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                     text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3 mx-auto"
          >
            <Upload className="h-6 w-6" />
            <span>{isLoading ? 'Loading Dataset...' : 'Load Menu Dataset'}</span>
          </button>
        </div>

        {isLoading && (
          <div className="mt-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Importing menu data and recipes...</p>
          </div>
        )}
      </div>
    </div>
  )
}