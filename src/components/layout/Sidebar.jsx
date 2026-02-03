import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Building2,
  CreditCard,
  Receipt,
  UsersIcon,
  Clock,
  Package2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'

const Sidebar = () => {
  const { logout, user } = useAuth()

  const menuGroups = [
    {
      title: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'People',
      items: [
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/suppliers', label: 'Suppliers', icon: ShoppingBag },
        { path: '/mazdoors', label: 'Mazdoors', icon: UserCheck },
      ]
    },

    {
      title: 'Inventory',
      items: [
        { path: '/items', label: 'Items', icon: Package },
        { path: '/inventory', label: 'Stock', icon: TrendingUp },
      ]
    },
    {
      title: 'Financial',
      items: [
        { path: '/transactions', label: 'Transactions', icon: FileText },
        { path: '/expenses', label: 'Expenses', icon: DollarSign },
        { path: '/payments', label: 'Payments', icon: CreditCard },
        { path: '/accounts', label: 'Accounts', icon: Building2 },
        { path: '/labour-expenses', label: 'Labour Expenses', icon: Clock },
        { path: '/labour', label: 'Labour', icon: UsersIcon },
        { path: '/daily-cash-memo', label: 'Daily Cash Memo', icon: Receipt },
      ]
    }
  ]

  // Add Users menu only for admin
  if (user?.role === 'admin') {
    menuGroups.push({
      title: 'Settings',
      items: [
        { path: '/users', label: 'Users', icon: Settings },
      ]
    })
  }

  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">Muslim Daal Mill</h1>
            <p className="text-[10px] text-gray-400">Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 sidebar-scrollbar">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-0.5">
            <h3 className="px-2.5 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "flex items-center justify-center w-7 h-7 rounded flex-shrink-0",
                        isActive ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-2.5 border-t border-gray-100 space-y-2">
        <div className="px-2.5 py-1.5 rounded-md bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase">Logged in</p>
          <p className="text-xs font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
          <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
        </div>
        <Button onClick={logout} variant="ghost" className="w-full justify-center h-8 text-xs" size="sm">
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
