import { NavLink } from 'react-router-dom'
import {
  Building2,
  Palette,
  BriefcaseBusiness,
  TrendingUp,
  Settings,
  Users,
  FileText,
  BrainCircuit,
  LayoutDashboard
} from 'lucide-react'

const navItems = [
  { path: '/recruiter/company', label: 'Overview', icon: LayoutDashboard },
  { path: '/recruiter/company/profile', label: 'Profile', icon: Building2 },
  { path: '/recruiter/company/branding', label: 'Branding', icon: Palette },
  { path: '/recruiter/company/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { path: '/recruiter/company/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/recruiter/company/settings', label: 'Settings', icon: Settings },
  { path: '/recruiter/company/team', label: 'Team', icon: Users },
  { path: '/recruiter/company/documents', label: 'Documents', icon: FileText },
  { path: '/recruiter/company/ai-metrics', label: 'AI Metrics', icon: BrainCircuit },
]

const CompanySubNav = () => {
  return (
    <div className="flex gap-1 border-b border-surface-200 bg-white p-2 rounded-2xl shadow-sm border border-surface-100 overflow-x-auto scrollbar-none mb-6">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export default CompanySubNav
