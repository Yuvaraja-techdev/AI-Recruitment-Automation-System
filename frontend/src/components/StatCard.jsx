import { Users, UserCheck, UserX, Clock } from 'lucide-react'

const iconMap = {
  total: Users,
  selected: UserCheck,
  rejected: UserX,
  pending: Clock,
}

const colorMap = {
  total: {
    bg: 'bg-brand-50',
    icon: 'text-brand-600',
    accent: 'bg-brand-500',
  },
  selected: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    accent: 'bg-emerald-500',
  },
  rejected: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    accent: 'bg-red-500',
  },
  pending: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    accent: 'bg-amber-500',
  },
}

const StatCard = ({ type, label, value, delay = 0 }) => {
  const Icon = iconMap[type] || Users
  const colors = colorMap[type] || colorMap.total

  return (
    <div
      className="stat-card group relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent bar at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent} rounded-t-2xl opacity-80`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500 mb-1">{label}</p>
          <p className="text-3xl font-bold font-display text-surface-900 tracking-tight animate-count-up">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={2} />
        </div>
      </div>

      {/* Subtle footer */}
      <div className="mt-4 pt-3 border-t border-surface-100">
        <p className="text-xs text-surface-400 font-medium">
          {type === 'total' && 'All applications'}
          {type === 'selected' && 'Ready for next round'}
          {type === 'rejected' && 'Not shortlisted'}
          {type === 'pending' && 'Awaiting review'}
        </p>
      </div>
    </div>
  )
}

export default StatCard
