import { useState } from 'react'
import { 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  BookOpen,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and recent activity'
  },
  {
    id: 'generator',
    label: 'Plan Generator',
    icon: Sparkles,
    description: 'Create new therapy plans'
  },
  {
    id: 'patients',
    label: 'Patient Profiles',
    icon: Users,
    description: 'Manage patient information'
  },
  {
    id: 'library',
    label: 'Plan Library',
    icon: BookOpen,
    description: 'Browse saved plans and templates'
  }
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/80 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation sidebar */}
      <nav className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r transform transition-transform duration-200 ease-in-out lg:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a section to get started</p>
          </div>
          
          <div className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mt-0.5 flex-shrink-0",
                    isActive ? "text-white" : "text-gray-400"
                  )} />
                  <div>
                    <div className={cn(
                      "font-medium",
                      isActive ? "text-white" : "text-gray-900"
                    )}>
                      {item.label}
                    </div>
                    <div className={cn(
                      "text-sm mt-0.5",
                      isActive ? "text-blue-100" : "text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}