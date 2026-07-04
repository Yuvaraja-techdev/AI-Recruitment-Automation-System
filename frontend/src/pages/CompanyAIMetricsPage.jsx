import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BrainCircuit,
  TrendingUp,
  Award,
  Sparkles,
  Gauge,
  Loader2,
  AlertCircle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { getCompanyAiMetrics, getCompany } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'
import ErrorState from '../components/ErrorState'

const COLORS = {
  BRAND:     '#6366f1',
  INTERVIEW: '#8b5cf6',
  SUCCESS:   '#10b981',
  WARNING:   '#f59e0b',
  DANGER:    '#ef4444',
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

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card relative overflow-hidden flex items-start justify-between">
    <div className={`absolute top-0 left-0 right-0 h-1 ${color} rounded-t-2xl`} />
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black font-display text-surface-900 tracking-tight">{value}</p>
      {sub && <p className="text-[10px] text-surface-400 font-medium">{sub}</p>}
    </div>
    <div className={`p-2.5 rounded-xl ${bg}`}>
      <Icon className={`w-5 h-5`} />
    </div>
  </div>
)

const InsightRow = ({ title, text, type }) => {
  const styles = {
    info: 'bg-indigo-50/50 border-indigo-100 text-indigo-800',
    success: 'bg-emerald-50/50 border-emerald-100 text-emerald-800',
    warning: 'bg-amber-50/50 border-amber-100 text-amber-800',
  }
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${styles[type] || styles.info}`}>
      <Lightbulb className="w-5 h-5 flex-shrink-0 text-brand-500" />
      <div className="space-y-1">
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
        <p className="text-xs opacity-90 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

const CompanyAIMetricsPage = () => {
  const [metrics, setMetrics] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMetrics = async () => {
    setLoading(true)
    setError('')
    try {
      const [metricsData, companyData] = await Promise.all([
        getCompanyAiMetrics(),
        getCompany(),
      ])
      setMetrics(metricsData)
      setCompany(companyData)
    } catch (err) {
      setError('Failed to load AI statistics. Please check backend server log.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) return <LoadingSkeleton type="analytics" />
  if (error) return <ErrorState message={error} onRetry={fetchMetrics} />

  // Resume Quality Chart Data
  const qualityData = [
    { name: 'Excellent (85+)', value: metrics.resume_quality.excellent, color: COLORS.SUCCESS },
    { name: 'Good (70-84)',    value: metrics.resume_quality.good,      color: COLORS.BLUE },
    { name: 'Average (50-69)', value: metrics.resume_quality.average,   color: COLORS.WARNING },
    { name: 'Poor (<50)',      value: metrics.resume_quality.poor,      color: COLORS.DANGER },
  ].filter((d) => d.value > 0)

  // Generate automated insights based on stats
  const generateInsights = () => {
    const list = []
    if (metrics.avg_ats_score < 70) {
      list.push({
        title: 'Screening Filters Too Lax',
        text: 'The average applicant ATS score is under 70%. Consider specifying detailed skills and core requirements in job descriptions to attract better candidates.',
        type: 'warning',
      })
    } else {
      list.push({
        title: 'Strong Resume Matches',
        text: 'Average applicant profile matches 70%+ of your job criteria. Keep using active channels. The pipeline shows high alignment.',
        type: 'success',
      })
    }

    if (metrics.hiring_efficiency < 30) {
      list.push({
        title: 'Interview Loop Optimization',
        text: 'Low conversion from conducted interviews to hires. Ensure candidate expectations and salaries are aligned prior to booking AI interview sessions.',
        type: 'info',
      })
    } else {
      list.push({
        title: 'High Screening Conversion',
        text: 'Excellent interview-to-hire ratio. This suggests recruiters are shortlisting high-potential profiles before scheduling interviews.',
        type: 'success',
      })
    }

    if (metrics.interview_pass_rate < 40 && metrics.avg_ats_score >= 75) {
      list.push({
        title: 'Strict Shortlisting',
        text: 'High average resume matching score but relatively low interview booking count. Your recruiters might be overly selective or missing candidates due to manual review backlog.',
        type: 'warning',
      })
    }

    return list
  }

  const insightsList = generateInsights()
  const companyInitials = (company?.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
                {companyInitials}
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
                AI Hiring Metrics
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Automated statistics compiled from screening pipelines and AI evaluations
              </p>
            </div>
          </div>
        </div>
      </div>

      <CompanySubNav />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BrainCircuit}
          label="Average ATS Score"
          value={`${metrics.avg_ats_score}%`}
          sub="Resume keyword alignment"
          color="bg-brand-500"
          bg="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon={Award}
          label="Avg Interview Score"
          value={`${metrics.avg_interview_score}/10`}
          sub="AI evaluation rating"
          color="bg-purple-500"
          bg="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Selection Rate"
          value={`${metrics.selection_rate}%`}
          sub="Hired vs Total applications"
          color="bg-emerald-500"
          bg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Gauge}
          label="Hiring Efficiency"
          value={`${metrics.hiring_efficiency.toFixed(1)}%`}
          sub="Offers accepted / Interviews"
          color="bg-blue-500"
          bg="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 columns: Monthly AI Hiring Report */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Monthly AI Hiring Report</h3>
              <p className="text-[10px] text-surface-400 mt-0.5">MoM trends for applications, interviews, and successful hires</p>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthly_report} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.BLUE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.SUCCESS} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.SUCCESS} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke={COLORS.BLUE} fill="url(#colorApps)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.BLUE }} />
                <Area type="monotone" dataKey="interviews" name="Interviews" stroke={COLORS.INTERVIEW} fill="none" strokeWidth={2.5} strokeDasharray="4 3" dot={{ r: 3, fill: COLORS.INTERVIEW }} />
                <Area type="monotone" dataKey="hires" name="Hires" stroke={COLORS.SUCCESS} fill="url(#colorHires)" strokeWidth={2.5} dot={{ r: 3, fill: COLORS.SUCCESS }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 4 columns: Resume Quality distribution */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Resume Quality</h3>
            <p className="text-[10px] text-surface-400 mt-0.5">Distribution of candidate ATS screening scores</p>
          </div>

          {qualityData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-surface-400">
              No ATS scores recorded
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {qualityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Swatches list */}
          <div className="grid grid-cols-2 gap-2 border-t border-surface-100 pt-3 text-[10px]">
            {qualityData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-surface-600 font-medium truncate">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Conversion funnel + AI recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Funnel Conversions */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-surface-900">Pipeline Conversion</h3>
            <p className="text-[10px] text-surface-400 mt-0.5">Success indicators for applicant routing stages</p>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { label: 'Screening Pass Rate', value: `${metrics.interview_pass_rate.toFixed(1)}%`, detail: 'Percentage of applicants moving to AI Interview', bar: COLORS.INTERVIEW, pct: metrics.interview_pass_rate },
              { label: 'Selection Success Rate', value: `${metrics.selection_rate.toFixed(1)}%`, detail: 'Percentage of total applicants successfully selected', bar: COLORS.SUCCESS, pct: metrics.selection_rate },
              { label: 'Hiring Efficiency', value: `${metrics.hiring_efficiency.toFixed(1)}%`, detail: 'Conversion rate of interviewed candidates into hires', bar: COLORS.BLUE, pct: metrics.hiring_efficiency },
              { label: 'Rejection Rate', value: `${metrics.rejection_rate.toFixed(1)}%`, detail: 'Candidates marked as unsuitable during evaluation', bar: COLORS.DANGER, pct: metrics.rejection_rate },
            ].map(({ label, value, detail, bar, pct }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-surface-700">{label}</span>
                  <span className="font-extrabold text-surface-900">{value}</span>
                </div>
                <div className="h-2 bg-surface-50 border border-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: bar }}
                  />
                </div>
                <p className="text-[10px] text-surface-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Actionable Insights */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4 flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-surface-900">AI Recommendations</h3>
            <p className="text-[10px] text-surface-400 mt-0.5">Contextual advice generated from your pipeline datasets</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
            {insightsList.map((item, idx) => (
              <InsightRow key={idx} title={item.title} text={item.text} type={item.type} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CompanyAIMetricsPage
