import { Bot, MessageCircle, Lightbulb, TrendingUp } from 'lucide-react'

export default function AIAssistant() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600">Get intelligent insights and recommendations for your restaurant</p>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center mb-4">
            <Bot className="h-8 w-8 text-blue-600" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Smart Recommendations</h3>
          </div>
          <p className="text-gray-600 mb-4">Get AI-powered suggestions for inventory management and ordering.</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
            Get Recommendations
          </button>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <MessageCircle className="h-8 w-8 text-green-600" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Chat Assistant</h3>
          </div>
          <p className="text-gray-600 mb-4">Ask questions about your data and get instant insights.</p>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
            Start Chat
          </button>
        </div>

        <div className="card">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Predictive Analytics</h3>
          </div>
          <p className="text-gray-600 mb-4">Forecast demand and optimize your menu pricing.</p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
            View Analytics
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Features Coming Soon</h3>
          <p className="text-gray-600">
            We're working on advanced AI features including automated ordering, 
            demand prediction, and intelligent menu optimization.
          </p>
        </div>
      </div>
    </div>
  )
}