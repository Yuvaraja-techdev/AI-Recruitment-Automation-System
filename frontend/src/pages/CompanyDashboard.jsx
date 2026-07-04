import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Users,
  BriefcaseBusiness,
  Mic,
  UserCheck,
  TrendingUp,
  Calendar,
  ExternalLink,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  Layers,
  Clock,
  Palette,
  Settings,
  FileText,
  BrainCircuit,
} from 'lucide-react'
import { getCompany, getCompanyStats } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'
import ErrorState from '../components/ErrorState'

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card group relative overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-1 ${color} rounded-t-2xl opacity-80`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-surface-500 mb-1">{label}</p>
        <p className="text-3xl font-bold font-display text-surface-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
      </div>
      <div className="p-3 rounded-xl bg-surface-50 transition-transform duration-300 group-hover:scale-110">
        <Icon className="w-5 h-5 text-surface-500" strokeWidth={2} />
      </div>
    </div>
  </div>
)

const InfoRow = ({ icon: Icon, label, value, href }) => {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="p-2 rounded-lg bg-surface-50 flex-shrink-0">
        <Icon className="w-4 h-4 text-surface-400" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline font-medium truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-surface-700 font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

const PipelineBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-surface-600">{label}</span>
        <span className="font-bold text-surface-800">{value} <span className="text-surface-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const CompanyDashboard = () => {
  const [company, setCompany] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyData, statsData] = await Promise.all([
          getCompany(),
          getCompanyStats(),
        ])
        setCompany(companyData)
        setStats(statsData)
      } catch (err) {
        setError('Failed to load company workspace. Please restart the backend server.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSkeleton type="analytics" />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />

  const totalCandidates =
    (stats.candidates_selected || 0) +
    (stats.candidates_rejected || 0) +
    (stats.candidates_pending || 0)

  // Company initial letters for avatar
  const initials = (company.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
            Company Workspace
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Your organization headquarters &amp; hiring command center
          </p>
        </div>
        <Link
          to="/recruiter/company/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 group"
        >
          Edit Company Profile
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>

      <CompanySubNav />

      {/* Company Identity Card */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {/* Banner */}
        <div
          className="h-28 w-full relative"
          style={{
            background: company.banner_url
              ? `url(${company.banner_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${company.brand_color || '#6366f1'}22 0%, ${company.brand_color || '#6366f1'}44 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-transparent" />
        </div>

        {/* Identity row */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
            {/* Logo / Initials Avatar */}
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt="Company Logo"
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black flex-shrink-0"
                style={{ background: company.brand_color || '#6366f1' }}
              >
                {initials}
              </div>
            )}
            <div className="pb-1">
              <h2 className="text-xl font-bold font-display text-surface-900">{company.name}</h2>
              <p className="text-sm text-surface-500 mt-0.5">{company.industry || 'Technology'}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow icon={MapPin} label="Headquarters" value={company.headquarters} />
            <InfoRow icon={Users} label="Company Size" value={company.size} />
            <InfoRow icon={Calendar} label="Founded" value={company.founded_year?.toString()} />
            <InfoRow icon={Globe} label="Website" value={company.website} href={company.website} />
            <InfoRow icon={Mail} label="Email" value={company.email} href={`mailto:${company.email}`} />
            <InfoRow icon={Clock} label="Timezone" value={company.timezone} />
          </div>

          {/* Description */}
          {company.description && (
            <p className="mt-4 text-sm text-surface-600 leading-relaxed border-t border-surface-100 pt-4">
              {company.description}
            </p>
          )}
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={BriefcaseBusiness}
          label="Active Jobs"
          value={stats.active_jobs}
          sub="Open positions"
          color="bg-brand-500"
        />
        <StatCard
          icon={Layers}
          label="Applications"
          value={stats.total_applications}
          sub="Total received"
          color="bg-blue-500"
        />
        <StatCard
          icon={Mic}
          label="Interviews"
          value={stats.interviews_conducted}
          sub="AI sessions completed"
          color="bg-purple-500"
        />
        <StatCard
          icon={UserCheck}
          label="Hires"
          value={stats.candidates_selected}
          sub="Candidates selected"
          color="bg-emerald-500"
        />
      </div>

      {/* Lower Grid: Pipeline + Social Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hiring Pipeline Funnel */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50">
              <TrendingUp className="w-5 h-5 text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-display text-surface-900">Hiring Pipeline</h2>
              <p className="text-xs text-surface-400">Current candidate funnel overview</p>
            </div>
          </div>
          <div className="space-y-4">
            <PipelineBar label="Applications" value={stats.total_applications} total={stats.total_applications} color="bg-blue-400" />
            <PipelineBar label="Interviews Conducted" value={stats.interviews_conducted} total={stats.total_applications} color="bg-purple-400" />
            <PipelineBar label="Selected / Hired" value={stats.candidates_selected} total={stats.total_applications} color="bg-emerald-400" />
            <PipelineBar label="Rejected" value={stats.candidates_rejected} total={stats.total_applications} color="bg-red-400" />
            <PipelineBar label="Pending Review" value={stats.candidates_pending} total={stats.total_applications} color="bg-amber-400" />
          </div>
        </div>

        {/* Social Links + Quick Nav */}
        <div className="space-y-5">

          {/* Social Links */}
          {(company.linkedin || company.twitter || company.github) && (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
              <h3 className="text-sm font-semibold font-display text-surface-900 uppercase tracking-wider">
                Social Presence
              </h3>
              <div className="space-y-3">
                {company.linkedin && (
                  <a href={company.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-surface-600 hover:text-brand-600 transition-colors group">
                    <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium truncate">{company.linkedin}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                )}
                {company.twitter && (
                  <a href={company.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-surface-600 hover:text-sky-600 transition-colors group">
                    <div className="p-2 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors">
                      <Twitter className="w-4 h-4 text-sky-500" />
                    </div>
                    <span className="font-medium truncate">{company.twitter}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                )}
                {company.github && (
                  <a href={company.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-surface-600 hover:text-surface-900 transition-colors group">
                    <div className="p-2 rounded-lg bg-surface-50 group-hover:bg-surface-100 transition-colors">
                      <Github className="w-4 h-4 text-surface-700" />
                    </div>
                    <span className="font-medium truncate">{company.github}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick navigation shortcuts */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-3">
            <h3 className="text-sm font-semibold font-display text-surface-900 uppercase tracking-wider">
              Workspace Shortcuts
            </h3>
            <div className="space-y-2">
              {[
                { to: '/recruiter/company/profile',   label: 'Edit Company Profile',  icon: Building2 },
                { to: '/recruiter/company/branding',  label: 'Brand Studio',          icon: Palette },
                { to: '/recruiter/company/jobs',      label: 'Company Job Postings',  icon: BriefcaseBusiness },
                { to: '/recruiter/company/analytics', label: 'Company Analytics',     icon: TrendingUp },
                { to: '/recruiter/company/settings',  label: 'Organization Settings', icon: Settings },
                { to: '/recruiter/company/team',      label: 'Recruiter Team Management', icon: Users },
                { to: '/recruiter/company/documents', label: 'Company Documents',     icon: FileText },
                { to: '/recruiter/company/ai-metrics', label: 'AI Hiring Metrics',    icon: BrainCircuit },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-sm font-medium text-surface-700 group"
                >
                  <Icon className="w-4 h-4 text-surface-400 group-hover:text-brand-600 transition-colors" strokeWidth={1.8} />
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-surface-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default CompanyDashboard
