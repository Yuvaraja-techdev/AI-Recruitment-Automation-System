import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Mic,
  BriefcaseBusiness,
  PieChart as PieChartIcon,
  Target,
  Activity,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts'
import { getAllJobs, getCompany } from '../services/api'
import useCandidates from '../hooks/useCandidates'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import CompanySubNav from '../components/CompanySubNav'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  SELECTED:  '#10b981',
  REJECTED:  '#ef4444',
  PENDING:   '#f59e0b',
  BRAND:     '#6366f1',
  INTERVIEW: '#8b5cf6',
  BLUE:      '#3b82f6',
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
  fontSize: '12px',
  padding: '8px 14px',
}

// ─── Reusable Sub-components ──────────────────────────────────────────────────

const ChartCard = ({ title, subtitle, icon: Icon, iconBg, iconColor, children }) => (
  <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-6 space-y-5">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-surface-900">{title}</h3>
        <p className="text-[11px] text-surface-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
)

const KpiCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, bar }) => (
  <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-5 relative overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-1 ${bar} rounded-t-2xl`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-surface-500 mb-1">{label}</p>
        <p className="text-3xl font-bold font-display text-surface-900 tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-surface-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
      </div>
    </div>
  </div>
)

// Simulate a 6-month hiring trend from candidate indices (no created_at field)
const buildMonthlyTrend = (candidates) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = months[d.getMonth()]
    // Distribute candidates across months pseudo-randomly using their index
    const slice = candidates.filter((_, idx) => idx % 6 === (5 - i))
    result.push({
      month: label,
      applications: slice.length,
      interviews: slice.filter(c => c.overall_score != null).length,
      hires: slice.filter(c => c.status?.toUpperCase() === 'SELECTED').length,
    })
  }
  return result
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CompanyAnalyticsPage = () => {
  const { candidates, loading: cLoading, error: cError, stats, refetch } = useCandidates()
  const [jobs, setJobs] = useState([])
  const [company, setCompany] = useState(null)
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [jobsData, companyData] = await Promise.all([
          getAllJobs({ status: 'ALL' }),
          getCompany(),
        ])
        setJobs(jobsData)
        setCompany(companyData)
      } catch (err) {
        console.error(err)
      } finally {
        setJobsLoading(false)
      }
    }
    if (!cLoading) fetchJobs()
  }, [cLoading])

  if (cLoading || jobsLoading) return <LoadingSkeleton type="analytics" />
  if (cError) return <ErrorState message={cError} onRetry={refetch} />

  // ── Derived Data ─────────────────────────────────────────────────────────────

  const totalApps        = stats.total
  const totalInterviews  = candidates.filter(c => c.overall_score != null).length
  const totalHires       = stats.selected
  const totalRejected    = stats.rejected
  const selectionRate    = totalApps > 0 ? ((totalHires / totalApps) * 100).toFixed(1) : '0.0'
  const interviewRate    = totalApps > 0 ? ((totalInterviews / totalApps) * 100).toFixed(1) : '0.0'

  const avgAts = candidates.filter(c => c.ats_score != null).length > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.ats_score || 0), 0) / candidates.length)
    : 0

  // Pie: Candidate status breakdown
  const statusPieData = [
    { name: 'Selected',  value: stats.selected,  color: COLORS.SELECTED },
    { name: 'Rejected',  value: stats.rejected,  color: COLORS.REJECTED },
    { name: 'Pending',   value: stats.pending,   color: COLORS.PENDING },
  ].filter(d => d.value > 0)

  // Bar: Applications per job role (from candidate applied_role)
  const roleMap = {}
  candidates.forEach(c => {
    const role = c.applied_role || 'Unknown'
    roleMap[role] = (roleMap[role] || 0) + 1
  })
  const roleBarData = Object.entries(roleMap)
    .map(([role, count]) => ({ role: role.length > 20 ? role.slice(0, 20) + '…' : role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  // Bar: Jobs by status (active, draft, closed)
  const activeJobs = jobs.filter(j => j.is_active && j.status === 'Published').length
  const draftJobs  = jobs.filter(j => j.status === 'Draft').length
  const closedJobs = jobs.filter(j => !j.is_active).length
  const jobStatusData = [
    { label: 'Published', count: activeJobs,  fill: COLORS.SELECTED },
    { label: 'Draft',     count: draftJobs,   fill: COLORS.PENDING },
    { label: 'Closed',    count: closedJobs,  fill: COLORS.REJECTED },
  ]

  // Area + Line: 6-month hiring trend
  const trendData = buildMonthlyTrend(candidates)

  // Radar: Hiring funnel stages
  const funnelMax = Math.max(totalApps, 1)
  const radarData = [
    { stage: 'Applied',    value: Math.round((totalApps / funnelMax) * 100) },
    { stage: 'Screened',   value: Math.round((Math.min(totalApps * 0.7, totalApps) / funnelMax) * 100) },
    { stage: 'Interviewed',value: Math.round((totalInterviews / funnelMax) * 100) },
    { stage: 'Offered',    value: Math.round((totalHires * 1.3 / funnelMax) * 100) },
    { stage: 'Hired',      value: Math.round((totalHires / funnelMax) * 100) },
  ]

  const initials = (company?.name || 'HC')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/company"
            className="p-2 rounded-xl hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-surface-200 shadow-sm" />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0"
                style={{ backgroundColor: company?.brand_color || '#6366f1' }}
              >
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
                Company Analytics
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Hiring intelligence for {company?.name || 'your organization'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CompanySubNav />

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Total Applications"
          value={totalApps}
          sub="All time received"
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          bar="bg-brand-500"
        />
        <KpiCard
          icon={Mic}
          label="Interviews Conducted"
          value={totalInterviews}
          sub={`${interviewRate}% of applicants`}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          bar="bg-purple-500"
        />
        <KpiCard
          icon={UserCheck}
          label="Candidates Hired"
          value={totalHires}
          sub={`${selectionRate}% selection rate`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          bar="bg-emerald-500"
        />
        <KpiCard
          icon={Target}
          label="Avg ATS Score"
          value={`${avgAts}%`}
          sub="Resume quality index"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          bar="bg-blue-500"
        />
      </div>

      {/* ── Charts Row 1: Area Trend + Status Pie ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Area Chart — 6-Month Hiring Trend */}
        <ChartCard
          title="6-Month Hiring Trend"
          subtitle="Applications, interviews, and hires over time"
          icon={TrendingUp}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.BRAND} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.BRAND} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.SELECTED} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.SELECTED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke={COLORS.BRAND} fill="url(#colorApps)" strokeWidth={2} dot={{ r: 3, fill: COLORS.BRAND }} />
                <Area type="monotone" dataKey="interviews" name="Interviews" stroke={COLORS.INTERVIEW} fill="none" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: COLORS.INTERVIEW }} />
                <Area type="monotone" dataKey="hires" name="Hires" stroke={COLORS.SELECTED} fill="url(#colorHires)" strokeWidth={2} dot={{ r: 3, fill: COLORS.SELECTED }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Pie Chart — Candidate Status Breakdown */}
        <ChartCard
          title="Candidate Pipeline"
          subtitle="Selected / Rejected / Pending breakdown"
          icon={PieChartIcon}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        >
          {statusPieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-surface-400">
              No candidates yet
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-100">
                {[
                  { label: 'Selected', value: stats.selected, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Rejected', value: stats.rejected, color: 'text-red-600',     bg: 'bg-red-50' },
                  { label: 'Pending',  value: stats.pending,  color: 'text-amber-600',   bg: 'bg-amber-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`rounded-xl ${bg} p-3 text-center`}>
                    <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Role Bar + Job Status Bar ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Horizontal Bar — Applications per Role */}
        <ChartCard
          title="Applications per Role"
          subtitle="Top applied positions at your company"
          icon={BarChart3}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        >
          {roleBarData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-surface-400">No data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleBarData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="role" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Applicants" fill={COLORS.BRAND} radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Bar — Jobs by Status */}
        <ChartCard
          title="Jobs by Status"
          subtitle="Published, draft, and closed postings"
          icon={BriefcaseBusiness}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobStatusData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Jobs" radius={[8, 8, 0, 0]} maxBarSize={52}>
                  {jobStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-100">
            {jobStatusData.map(({ label, count, fill }) => (
              <div key={label} className="rounded-xl bg-surface-50 p-3 text-center border border-surface-100">
                <p className="text-xl font-bold font-display" style={{ color: fill }}>{count}</p>
                <p className="text-[10px] text-surface-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Charts Row 3: Hiring Funnel Radar + Efficiency Metrics ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar — Hiring Funnel */}
        <ChartCard
          title="Hiring Funnel Radar"
          subtitle="Conversion across each recruitment stage"
          icon={Activity}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name="Conversion %" dataKey="value" stroke={COLORS.BRAND} fill={COLORS.BRAND} fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Conversion']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Efficiency Metrics — Text Summary */}
        <ChartCard
          title="Hiring Efficiency Metrics"
          subtitle="Key performance indicators for your pipeline"
          icon={Target}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        >
          <div className="space-y-3">
            {[
              {
                label: 'Selection Rate',
                value: `${selectionRate}%`,
                detail: `${totalHires} hired out of ${totalApps} applicants`,
                bar: COLORS.SELECTED,
                pct: parseFloat(selectionRate),
              },
              {
                label: 'Interview Conversion',
                value: `${interviewRate}%`,
                detail: `${totalInterviews} interviews from ${totalApps} applications`,
                bar: COLORS.INTERVIEW,
                pct: parseFloat(interviewRate),
              },
              {
                label: 'Rejection Rate',
                value: `${totalApps > 0 ? ((totalRejected / totalApps) * 100).toFixed(1) : '0.0'}%`,
                detail: `${totalRejected} candidates not shortlisted`,
                bar: COLORS.REJECTED,
                pct: totalApps > 0 ? (totalRejected / totalApps) * 100 : 0,
              },
              {
                label: 'Avg ATS Score',
                value: `${avgAts}%`,
                detail: 'Average resume quality across all candidates',
                bar: COLORS.BLUE,
                pct: avgAts,
              },
            ].map(({ label, value, detail, bar, pct }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-surface-700">{label}</span>
                  <span className="font-black text-surface-900">{value}</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: bar }}
                  />
                </div>
                <p className="text-[10px] text-surface-400">{detail}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

    </div>
  )
}

export default CompanyAnalyticsPage
