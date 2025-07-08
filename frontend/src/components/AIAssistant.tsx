import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Camera,
  BarChart3,
  AlertTriangle,
  Target,
  Zap,
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  DollarSign,
  Calendar,
  CloudRain,
  Users
} from 'lucide-react';
import './AIAssistant.css';

interface AIInsight {
  id: string;
  type: 'forecast' | 'recommendation' | 'alert' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action?: string;
  data?: any;
  timestamp: string;
}

interface DemandForecast {
  ingredient_id: string;
  ingredient_name: string;
  current_stock: number;
  predicted_demand_7d: number;
  predicted_demand_30d: number;
  reorder_recommendation: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonal_factor: number;
}

interface MenuOptimization {
  recipe_id: string;
  recipe_name: string;
  profitability_score: number;
  demand_score: number;
  ingredient_availability: number;
  recommendation: 'promote' | 'optimize' | 'consider_removing' | 'seasonal_special';
  suggested_price: number;
  current_price: number;
}

const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'forecasting' | 'optimization'>('chat');
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', content: string, timestamp: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [menuOptimizations, setMenuOptimizations] = useState<MenuOptimization[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Initialize AI assistant with welcome message and generate insights
    initializeAI();
    generateAIInsights();
    generateDemandForecasts();
    generateMenuOptimizations();
  }, []);

  const initializeAI = () => {
    const welcomeMessage = {
      role: 'ai' as const,
      content: `👋 Hello! I'm your AI Restaurant Assistant. I can help you with:

🔮 **Demand Forecasting** - Predict ingredient needs
📊 **Menu Optimization** - Maximize profitability  
🎯 **Smart Recommendations** - Cost-saving insights
🗣️ **Voice Commands** - "How much chicken do I need for next week?"
📱 **Natural Language** - Ask me anything about your inventory!

Try asking: "What ingredients should I order?" or "Analyze my menu profitability"`,
      timestamp: new Date().toISOString()
    };
    setChatMessages([welcomeMessage]);
  };

  const generateAIInsights = () => {
    // Simulate AI-generated insights based on restaurant data
    const aiInsights: AIInsight[] = [
      {
        id: 'insight-1',
        type: 'forecast',
        title: 'Weekend Rush Prediction',
        description: 'Based on historical data, expect 40% increase in Schnitzel Meal orders this weekend. Current ingredients sufficient for 15 meals, but you may need 25 meals worth.',
        confidence: 87,
        impact: 'high',
        action: 'Order additional schnitzel, potatoes',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight-2',
        type: 'recommendation',
        title: 'Cost Optimization Opportunity',
        description: 'Switch to Supplier B for potatoes could save $45/month (12% cost reduction) with same quality rating.',
        confidence: 92,
        impact: 'medium',
        action: 'Contact Supplier B for pricing',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight-3',
        type: 'alert',
        title: 'Seasonal Demand Shift',
        description: 'Summer approaching: 25% increase expected for salads, 15% decrease for heavy meals. Adjust inventory accordingly.',
        confidence: 78,
        impact: 'medium',
        action: 'Reduce meat orders, increase vegetables',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight-4',
        type: 'optimization',
        title: 'Menu Engineering Insight',
        description: 'Your Schnitzel Meal has 85% profit margin but only 12% of total sales. Consider promoting this high-profit item.',
        confidence: 94,
        impact: 'high',
        action: 'Create marketing campaign for Schnitzel Meal',
        timestamp: new Date().toISOString()
      },
      {
        id: 'insight-5',
        type: 'forecast',
        title: 'Weather Impact Analysis',
        description: 'Rainy weather predicted next week. Historically increases soup orders by 35% and decreases salad orders by 20%.',
        confidence: 71,
        impact: 'medium',
        action: 'Stock up on soup ingredients',
        timestamp: new Date().toISOString()
      }
    ];
    setInsights(aiInsights);
  };

  const generateDemandForecasts = () => {
    const forecasts: DemandForecast[] = [
      {
        ingredient_id: 'schnitzel-1',
        ingredient_name: 'Schnitzel',
        current_stock: 20,
        predicted_demand_7d: 15,
        predicted_demand_30d: 65,
        reorder_recommendation: 25,
        confidence: 89,
        trend: 'increasing',
        seasonal_factor: 1.2
      },
      {
        ingredient_id: 'potatoes-1',
        ingredient_name: 'Potatoes',
        current_stock: 5000,
        predicted_demand_7d: 3200,
        predicted_demand_30d: 14500,
        reorder_recommendation: 8000,
        confidence: 94,
        trend: 'stable',
        seasonal_factor: 1.0
      },
      {
        ingredient_id: 'lettuce-1',
        ingredient_name: 'Lettuce',
        current_stock: 1500,
        predicted_demand_7d: 2100,
        predicted_demand_30d: 9200,
        reorder_recommendation: 3000,
        confidence: 76,
        trend: 'increasing',
        seasonal_factor: 1.4
      }
    ];
    setDemandForecasts(forecasts);
  };

  const generateMenuOptimizations = () => {
    const optimizations: MenuOptimization[] = [
      {
        recipe_id: 'recipe-schnitzel-meal',
        recipe_name: 'Schnitzel Meal',
        profitability_score: 85,
        demand_score: 45,
        ingredient_availability: 92,
        recommendation: 'promote',
        suggested_price: 19.50,
        current_price: 18.50
      },
      {
        recipe_id: 'recipe-caesar-salad',
        recipe_name: 'Caesar Salad',
        profitability_score: 65,
        demand_score: 78,
        ingredient_availability: 88,
        recommendation: 'optimize',
        suggested_price: 12.00,
        current_price: 13.50
      },
      {
        recipe_id: 'recipe-pasta-special',
        recipe_name: 'Pasta Special',
        profitability_score: 45,
        demand_score: 32,
        ingredient_availability: 95,
        recommendation: 'consider_removing',
        suggested_price: 14.00,
        current_price: 15.50
      }
    ];
    setMenuOptimizations(optimizations);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulate AI processing and response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('order') || input.includes('buy') || input.includes('purchase')) {
      return `🛒 **Smart Ordering Recommendations:**

Based on your current inventory and AI analysis:

**🥩 High Priority:**
• Schnitzel: Order 25 pieces (predicted 65 needed in 30 days)
• Chicken Breast: Order 3kg (trending up 15%)

**🥬 Medium Priority:**  
• Lettuce: Order 3kg (summer demand increase)
• Tomatoes: Order 2kg (stable demand)

**💰 Cost Optimization:**
• Switch to Supplier B for potatoes (-12% cost)
• Buy olive oil in bulk (-8% cost)

**📊 Confidence:** 89% accuracy based on historical patterns`;
    }

    if (input.includes('menu') || input.includes('profit') || input.includes('price')) {
      return `📊 **Menu Optimization Analysis:**

**🌟 Star Performers:**
• Schnitzel Meal: 85% profit margin → Promote heavily!
• Garden Salad: 72% profit, high demand → Perfect balance

**⚠️ Needs Attention:**
• Pasta Special: Only 45% profit, low demand → Consider removal
• Fish & Chips: High cost ingredients → Increase price by $2

**💡 AI Recommendations:**
• Increase Schnitzel Meal price to $19.50 (+$1)
• Create "Healthy Summer" promotion for salads
• Bundle low-profit items with high-profit sides

**🎯 Profit Impact:** +$1,200/month potential increase`;
    }

    if (input.includes('forecast') || input.includes('predict') || input.includes('demand')) {
      return `🔮 **7-Day Demand Forecast:**

**📈 Trending Up:**
• Schnitzel: 15 pieces needed (+20% vs last week)
• Salad ingredients: 2.1kg lettuce (+25% summer effect)
• Cold beverages: +35% (hot weather predicted)

**📉 Trending Down:**
• Soup ingredients: -15% (seasonal shift)
• Heavy comfort foods: -10%

**🌦️ Weather Impact:**
• Rainy Tuesday-Wednesday → +30% indoor dining
• Sunny weekend → +20% outdoor seating demand

**🎯 Accuracy:** 94% prediction confidence`;
    }

    if (input.includes('waste') || input.includes('expiry') || input.includes('spoilage')) {
      return `♻️ **Waste Reduction AI Analysis:**

**⚠️ Expiry Alerts:**
• Lettuce: 3 days left → Use in daily specials
• Cream: 5 days left → Promote pasta dishes

**💡 Smart Suggestions:**
• Create "Market Special" menu using near-expiry items
• Offer staff meals to reduce waste
• Donate excess vegetables to local food bank

**📊 Waste Reduction Potential:**
• Current waste: 8% of inventory
• AI optimized: 3% potential waste
• Monthly savings: $340

**🤖 Auto-Actions:** Setting up smart alerts for future expiries`;
    }

    // Default intelligent response
    return `🤖 I understand you're asking about "${userInput}". Here's what I can help with:

**🔍 Inventory Intelligence:**
• Real-time demand forecasting
• Smart reordering recommendations  
• Cost optimization opportunities

**📊 Business Analytics:**
• Menu profitability analysis
• Seasonal trend predictions
• Supplier performance insights

**💡 Try asking:**
• "What should I order this week?"
• "Analyze my menu profitability"
• "Predict weekend demand"
• "How can I reduce waste?"
• "What's my best selling item?"

I'm learning your business patterns to provide increasingly accurate insights! 🚀`;
  };

  const toggleVoiceInput = () => {
    if (!isListening) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert('Voice recognition not supported in this browser');
      }
    } else {
      setIsListening(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'forecast': return <TrendingUp size={20} />;
      case 'recommendation': return <Lightbulb size={20} />;
      case 'alert': return <AlertTriangle size={20} />;
      case 'optimization': return <Target size={20} />;
      default: return <Brain size={20} />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-header">
        <div className="ai-header-left">
          <h1>
            <Brain size={32} />
            AI Restaurant Assistant
          </h1>
          <p>Powered by advanced machine learning and predictive analytics</p>
        </div>
        <div className="ai-status">
          <div className="ai-indicator">
            <Sparkles size={16} />
            <span>AI Active</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="ai-tab-navigation">
        <button 
          className={`ai-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          AI Chat
        </button>
        <button 
          className={`ai-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <Lightbulb size={16} />
          Smart Insights
        </button>
        <button 
          className={`ai-tab-btn ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasting')}
        >
          <TrendingUp size={16} />
          Demand Forecasting
        </button>
        <button 
          className={`ai-tab-btn ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          <Target size={16} />
          Menu Optimization
        </button>
      </div>

      {/* AI Chat Tab */}
      {activeTab === 'chat' && (
        <div className="ai-chat-container">
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'ai' ? <Bot size={20} /> : <Users size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="message ai">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your restaurant inventory..."
                className="chat-input"
              />
              <button
                onClick={toggleVoiceInput}
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                title="Voice input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={handleSendMessage}
                className="send-btn"
                disabled={!inputMessage.trim() || isProcessing}
              >
                <Send size={16} />
              </button>
            </div>
            
            <div className="quick-suggestions">
              <button onClick={() => setInputMessage("What should I order this week?")}>
                📦 Smart Ordering
              </button>
              <button onClick={() => setInputMessage("Analyze my menu profitability")}>
                💰 Menu Analysis
              </button>
              <button onClick={() => setInputMessage("Predict weekend demand")}>
                📊 Demand Forecast
              </button>
              <button onClick={() => setInputMessage("How can I reduce waste?")}>
                ♻️ Waste Reduction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights Tab */}
      {activeTab === 'insights' && (
        <div className="ai-insights-container">
          <div className="insights-header">
            <h2>AI-Generated Insights</h2>
            <span className="insights-count">{insights.length} active insights</span>
          </div>
          
          <div className="insights-grid">
            {insights.map(insight => (
              <div key={insight.id} className="insight-card">
                <div className="insight-header">
                  <div className="insight-icon" style={{ color: getInsightColor(insight.impact) }}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="insight-meta">
                    <span className="insight-type">{insight.type}</span>
                    <span className={`insight-impact ${insight.impact}`}>{insight.impact} impact</span>
                  </div>
                </div>
                
                <div className="insight-content">
                  <h3>{insight.title}</h3>
                  <p>{insight.description}</p>
                  
                  <div className="insight-confidence">
                    <span>AI Confidence: {insight.confidence}%</span>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${insight.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {insight.action && (
                    <div className="insight-action">
                      <Zap size={14} />
                      <span>{insight.action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demand Forecasting Tab */}
      {activeTab === 'forecasting' && (
        <div className="ai-forecasting-container">
          <div className="forecasting-header">
            <h2>AI Demand Forecasting</h2>
            <div className="forecasting-controls">
              <select className="time-range-select">
                <option value="7d">Next 7 Days</option>
                <option value="30d">Next 30 Days</option>
                <option value="90d">Next 90 Days</option>
              </select>
            </div>
          </div>
          
          <div className="forecast-stats">
            <div className="stat-card">
              <Calendar size={20} />
              <div>
                <span className="stat-value">94%</span>
                <span className="stat-label">Prediction Accuracy</span>
              </div>
            </div>
            <div className="stat-card">
              <TrendingUp size={20} />
              <div>
                <span className="stat-value">+15%</span>
                <span className="stat-label">Demand Growth</span>
              </div>
            </div>
            <div className="stat-card">
              <DollarSign size={20} />
              <div>
                <span className="stat-value">$340</span>
                <span className="stat-label">Potential Savings</span>
              </div>
            </div>
          </div>
          
          <div className="forecasts-table">
            <div className="table-header">
              <span>Ingredient</span>
              <span>Current Stock</span>
              <span>7-Day Forecast</span>
              <span>30-Day Forecast</span>
              <span>Reorder Recommendation</span>
              <span>Trend</span>
              <span>Confidence</span>
            </div>
            
            {demandForecasts.map(forecast => (
              <div key={forecast.ingredient_id} className="table-row">
                <span className="ingredient-name">{forecast.ingredient_name}</span>
                <span className="current-stock">{forecast.current_stock}</span>
                <span className="forecast-7d">{forecast.predicted_demand_7d}</span>
                <span className="forecast-30d">{forecast.predicted_demand_30d}</span>
                <span className="reorder-rec">{forecast.reorder_recommendation}</span>
                <span className={`trend ${forecast.trend}`}>
                  {forecast.trend === 'increasing' ? '📈' : forecast.trend === 'decreasing' ? '📉' : '➡️'}
                  {forecast.trend}
                </span>
                <span className="confidence">{forecast.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="ai-optimization-container">
          <div className="optimization-header">
            <h2>AI Menu Optimization</h2>
            <div className="optimization-summary">
              <span>Potential monthly revenue increase: <strong>+$1,200</strong></span>
            </div>
          </div>
          
          <div className="optimization-grid">
            {menuOptimizations.map(item => (
              <div key={item.recipe_id} className="optimization-card">
                <div className="optimization-header-card">
                  <h3>{item.recipe_name}</h3>
                  <span className={`recommendation-badge ${item.recommendation}`}>
                    {item.recommendation.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="optimization-metrics">
                  <div className="metric">
                    <span className="metric-label">Profitability Score</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill profitability" 
                        style={{ width: `${item.profitability_score}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{item.profitability_score}%</span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Demand Score</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill demand" 
                        style={{ width: `${item.demand_score}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{item.demand_score}%</span>
                  </div>
                  
                  <div className="metric">
                    <span className="metric-label">Ingredient Availability</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill availability" 
                        style={{ width: `${item.ingredient_availability}%` }}
                      ></div>
                    </div>
                    <span className="metric-value">{item.ingredient_availability}%</span>
                  </div>
                </div>
                
                <div className="price-optimization">
                  <div className="price-row">
                    <span>Current Price:</span>
                    <span>${item.current_price.toFixed(2)}</span>
                  </div>
                  <div className="price-row suggested">
                    <span>AI Suggested Price:</span>
                    <span>${item.suggested_price.toFixed(2)}</span>
                  </div>
                  <div className="price-impact">
                    Impact: {item.suggested_price > item.current_price ? '+' : ''}
                    ${(item.suggested_price - item.current_price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;