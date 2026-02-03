import { useAuth } from '../../contexts/AuthContext'
import { User, Bell, Settings } from 'lucide-react'
import Button from '../ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const Header = () => {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div>
          <h2 className="text-base font-medium text-gray-900">{user?.name || 'User'}</h2>
          <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-gray-500" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-8 px-2.5 text-gray-600">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <span className="text-xs max-w-[120px] truncate">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-sm">
              <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs">
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Header
