import { Activity, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import useCandidates from '../hooks/useCandidates'

const DashboardHome = () => {
  const { candidates, loading, error, stats, refetch } = useCandidates()

  if (loading) return <LoadingSpinner message="Loading dashboard..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Overview of your recruitment pipeline
          </p>
        </div>
        <Link
          to="/recruiter/candidates"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 group"
        >
          View All Candidates
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard type="total" label="Total Candidates" value={stats.total} delay={0} />
        <StatCard type="selected" label="Selected" value={stats.selected} delay={80} />
        <StatCard type="rejected" label="Rejected" value={stats.rejected} delay={160} />
        <StatCard type="pending" label="Pending Review" value={stats.pending} delay={240} />
      </div>

      {/* Quick Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-brand-50">
              <Activity className="w-5 h-5 text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-display text-surface-900">Pipeline Summary</h2>
              <p className="text-xs text-surface-400">Current hiring funnel</p>
            </div>
          </div>

          {/* Visual pipeline bars */}
          <div className="space-y-4">
            <PipelineBar
              label="Selected"
              count={stats.selected}
              total={stats.total}
              color="bg-emerald-500"
              bgColor="bg-emerald-100"
            />
            <PipelineBar
              label="Pending"
              count={stats.pending}
              total={stats.total}
              color="bg-amber-500"
              bgColor="bg-amber-100"
            />
            <PipelineBar
              label="Rejected"
              count={stats.rejected}
              total={stats.total}
              color="bg-red-500"
              bgColor="bg-red-100"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-display text-surface-900">Recent Candidates</h2>
              <p className="text-xs text-surface-400">Latest applications received</p>
            </div>
          </div>

          {candidates.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">No candidates yet</p>
          ) : (
            <div className="space-y-3">
              {candidates.slice(0, 5).map((candidate) => (
                <Link
                  key={candidate.candidate_id}
                  to={`/recruiter/candidates/${candidate.candidate_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800 group-hover:text-brand-700 transition-colors">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-surface-400">{candidate.applied_role}</p>
                    </div>
                  </div>
                  <StatusBadge status={candidate.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Pipeline progress bar component */
const PipelineBar = ({ label, count, total, color, bgColor }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-surface-700">{label}</span>
        <span className="text-sm font-semibold text-surface-900">
          {count} <span className="text-surface-400 font-normal">({percentage}%)</span>
        </span>
      </div>
      <div className={`h-2 rounded-full ${bgColor}`}>
        <div
          className={`h-2 rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}



export default DashboardHome
