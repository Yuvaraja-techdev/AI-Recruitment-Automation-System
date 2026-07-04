import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  Brain,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import useCandidates from '../hooks/useCandidates'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'

const COLORS = {
  SELECTED: '#10b981',
  REJECTED: '#ef4444',
  PENDING: '#f59e0b',
  BRAND: '#6366f1',
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
  fontSize: '13px',
  padding: '8px 14px',
}

const AnalyticsPage = () => {
  const { candidates, loading, error, stats, refetch } = useCandidates()

  if (loading) return <LoadingSkeleton type="analytics" />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const hasData = candidates.length > 0

  // Computed rates
  const selectionRate = stats.total > 0 ? ((stats.selected / stats.total) * 100).toFixed(1) : '0.0'
  const rejectionRate = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : '0.0'
  
  const validAtsScores = candidates.filter(c => c.ats_score !== null && c.ats_score !== undefined).map(c => c.ats_score)
  const avgAtsScore = validAtsScores.length > 0 
    ? `${Math.round(validAtsScores.reduce((sum, val) => sum + val, 0) / validAtsScores.length)}%`
    : '—'

  // Pie chart data
  const statusData = [
    { name: 'Selected', value: stats.selected, color: COLORS.SELECTED },
    { name: 'Rejected', value: stats.rejected, color: COLORS.REJECTED },
    { name: 'Pending', value: stats.pending, color: COLORS.PENDING },
  ].filter((d) => d.value > 0)

  // Bar chart — Applications per role
  const roleMap = {}
  candidates.forEach((c) => {
    const role = c.applied_role || 'Unknown'
    roleMap[role] = (roleMap[role] || 0) + 1
  })
  const roleData = Object.entries(roleMap)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)

  // Line chart — Applications over time (simulated timeline by index since there's no created_at)
  // Groups candidates into batches to simulate a timeline trend
  const timelineData = generateTimelineData(candidates)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand-50">
          <BarChart3 className="w-5 h-5 text-brand-600" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-surface-500">Recruitment insights and metrics</p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStat
          icon={Users}
          label="Total Applications"
          value={stats.total}
          color="text-brand-600"
          bg="bg-brand-50"
        />
        <AnalyticsStat
          icon={UserCheck}
          label="Selection Rate"
          value={`${selectionRate}%`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <AnalyticsStat
          icon={UserX}
          label="Rejection Rate"
          value={`${rejectionRate}%`}
          color="text-red-600"
          bg="bg-red-50"
        />
        <AnalyticsStat
          icon={Brain}
          label="Avg ATS Score"
          value={avgAtsScore}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl p-16 shadow-card text-center border border-surface-100">
          <p className="text-sm text-surface-400 font-medium">
            No data to display yet. Add candidates to see analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row 1 — Pie + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart — Status Distribution */}
            <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-100">
              <ChartHeader
                icon={PieChartIcon}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                title="Status Distribution"
                subtitle="Candidate pipeline breakdown"
              />

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '13px', color: '#64748b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-100">
                <MiniStat label="Selected" value={stats.selected} color="text-emerald-600" bg="bg-emerald-50" />
                <MiniStat label="Rejected" value={stats.rejected} color="text-red-600" bg="bg-red-50" />
                <MiniStat label="Pending" value={stats.pending} color="text-amber-600" bg="bg-amber-50" />
              </div>
            </div>

            {/* Bar Chart — Applications per Role */}
            <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-100">
              <ChartHeader
                icon={BarChart3}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                title="Applications per Role"
                subtitle="Distribution across open positions"
              />

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roleData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="role"
                      width={130}
                      tick={{ fontSize: 12, fill: '#475569' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={28} name="Applications" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs text-surface-400 font-medium">
                  {roleData.length} unique role{roleData.length !== 1 ? 's' : ''} across{' '}
                  {stats.total} total applications
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row 2 — Line Chart (full width) */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-100">
            <ChartHeader
              icon={TrendingUp}
              iconBg="bg-cyan-50"
              iconColor="text-cyan-600"
              title="Application Trend"
              subtitle="Cumulative applications over time"
            />

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '13px', color: '#64748b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.BRAND}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: COLORS.BRAND }}
                    activeDot={{ r: 6 }}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="selected"
                    stroke={COLORS.SELECTED}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.SELECTED }}
                    name="Selected"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke={COLORS.REJECTED}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.REJECTED }}
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-xs text-surface-400 font-medium">
                Showing cumulative application trend • Future: will use actual timestamps when available
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** Generate simulated timeline data from candidate list */
const generateTimelineData = (candidates) => {
  if (candidates.length === 0) return []

  const batchSize = Math.max(1, Math.ceil(candidates.length / 6))
  const data = []
  let cumulativeTotal = 0
  let cumulativeSelected = 0
  let cumulativeRejected = 0

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    cumulativeTotal += batch.length
    cumulativeSelected += batch.filter((c) => c.status?.toUpperCase() === 'SELECTED').length
    cumulativeRejected += batch.filter((c) => c.status?.toUpperCase() === 'REJECTED').length

    data.push({
      label: `Batch ${data.length + 1}`,
      total: cumulativeTotal,
      selected: cumulativeSelected,
      rejected: cumulativeRejected,
    })
  }

  return data
}

/** Reusable chart header */
const ChartHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`p-2 rounded-lg ${iconBg}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2} />
    </div>
    <div>
      <h2 className="text-base font-semibold font-display text-surface-900">{title}</h2>
      <p className="text-xs text-surface-400">{subtitle}</p>
    </div>
  </div>
)

/** Analytics stat card */
const AnalyticsStat = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl shadow-card p-5 border border-surface-100">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
      </div>
      <div>
        <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
        <p className="text-xs text-surface-400 font-medium">{label}</p>
      </div>
    </div>
  </div>
)

/** Mini stat for pie chart summary */
const MiniStat = ({ label, value, color, bg }) => (
  <div className={`text-center p-2.5 rounded-xl ${bg}`}>
    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
    <p className="text-xs text-surface-500 font-medium">{label}</p>
  </div>
)

export default AnalyticsPage
