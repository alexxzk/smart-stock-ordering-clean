import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Coffee,
  Building,
  Zap,
  Link,
  Activity,
  Folder,
  Box,
  ChefHat,
  Brain,
  Database,
  BookOpen
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Brain },
  { name: 'Menu Management', href: '/menu-management', icon: BookOpen },
  { name: 'Menu Data Import', href: '/menu-importer', icon: Database },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp },
  { name: 'Restaurant Inventory', href: '/restaurant-inventory', icon: ChefHat },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Products', href: '/products', icon: Box },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'Suppliers', href: '/suppliers', icon: Building },
  { name: 'Integrations', href: '/integrations', icon: Zap },
  { name: 'Supplier Integrations', href: '/supplier-integrations', icon: Link },
  { name: 'POS Analytics', href: '/pos-integrations', icon: Activity },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
]

export default function Sidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Coffee className="h-8 w-8 text-primary-600" />
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
                        ? 'bg-primary-100 text-primary-900'
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