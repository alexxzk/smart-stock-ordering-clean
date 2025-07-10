import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Coffee,
  Building,
  Zap,
  Bot,
  Database,
  ShoppingBag,
  Tag,
  Link2,
  CreditCard
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'Menu Data Import', href: '/menu-data-import', icon: Database },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp },
  { name: 'Restaurant Inventory', href: '/restaurant-inventory', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Suppliers', href: '/suppliers', icon: Building },
  { name: 'Supplier Ordering', href: '/supplier-ordering', icon: ShoppingCart },
  { name: 'Integrations', href: '/integrations', icon: Zap },
  { name: 'Supplier Integrations', href: '/supplier-integrations', icon: Link2 },
  { name: 'POS Analytics', href: '/pos-analytics', icon: CreditCard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
]

export default function Sidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Coffee className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-extrabold tracking-wide text-blue-700 uppercase">
                ordix.ai
              </span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
} 