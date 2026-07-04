import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { path: '/recruiter', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/recruiter/company', label: 'Company', icon: Building2 },
  { path: '/recruiter/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { path: '/recruiter/candidates', label: 'Candidates', icon: Users },
  { path: '/recruiter/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/recruiter/settings', label: 'Settings', icon: Settings },
]

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation()

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-surface-200 z-40 flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-100">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20">
          <BriefcaseBusiness className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold font-display text-surface-900 tracking-tight leading-none">
              HireFlow
            </h1>
            <p className="text-[10px] text-surface-400 font-medium tracking-wider uppercase mt-0.5">
              AI Recruitment
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item group ${
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-surface-100">
        <button
          onClick={onToggle}
          className="nav-item nav-item-inactive w-full justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" strokeWidth={1.8} />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" strokeWidth={1.8} />
              <span className="animate-fade-in">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
