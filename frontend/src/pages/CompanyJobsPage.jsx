import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Mic,
  UserCheck,
  CheckCircle,
  XCircle,
  MapPin,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { getAllJobs, deleteJob, updateJob, getCompany } from '../services/api'
import useCandidates from '../hooks/useCandidates'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import CompanySubNav from '../components/CompanySubNav'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'

// ─── Status pill ─────────────────────────────────────────────────────────────
const JobStatusPill = ({ status, isActive }) => {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-100 text-surface-500 uppercase tracking-wider">
        <XCircle className="w-3 h-3" /> Closed
      </span>
    )
  }
  const map = {
    Published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Draft: 'bg-amber-50 text-amber-700 border border-amber-200',
    Closed: 'bg-red-50 text-red-700 border border-red-200',
  }
  const cls = map[status] || map.Draft
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      <CheckCircle className="w-3 h-3" /> {status}
    </span>
  )
}

// ─── Metric Badge ─────────────────────────────────────────────────────────────
const MetricBadge = ({ icon: Icon, value, label, color }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${color}`}>
    <Icon className="w-3.5 h-3.5" />
    <span>{value}</span>
    <span className="font-normal opacity-70">{label}</span>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const CompanyJobsPage = () => {
  const { candidates, loading: candidatesLoading } = useCandidates()
  const [jobs, setJobs] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const fetchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsData, companyData] = await Promise.all([
        getAllJobs({ status: 'ALL' }),
        getCompany(),
      ])
      setCompany(companyData)

      // Enrich each job with candidate metrics
      const enriched = jobsData.map((job) => {
        const linked = candidates.filter(
          (c) => c.applied_role?.toLowerCase() === job.title?.toLowerCase()
        )
        return {
          ...job,
          applicationsCount: linked.length,
          interviewsCount: linked.filter((c) => c.overall_score != null).length,
          hiresCount: linked.filter((c) => c.status?.toUpperCase() === 'SELECTED').length,
        }
      })
      setJobs(enriched)
    } catch (err) {
      setError('Failed to load company jobs. Please check the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!candidatesLoading) fetchJobs()
  }, [candidatesLoading, candidates])

  // Toggle published / draft
  const handleToggleStatus = async (job) => {
    const next = job.status === 'Published' ? 'Draft' : 'Published'
    try {
      await updateJob(job.id, { status: next })
      setToast({ type: 'success', message: `Job marked as "${next}".` })
      fetchJobs()
    } catch {
      setToast({ type: 'error', message: 'Failed to update job status.' })
    }
  }

  // Toggle active/closed
  const handleToggleActive = async (job) => {
    try {
      await updateJob(job.id, { is_active: !job.is_active })
      setToast({ type: 'success', message: `Job ${job.is_active ? 'closed' : 're-opened'}.` })
      fetchJobs()
    } catch {
      setToast({ type: 'error', message: 'Failed to update job.' })
    }
  }

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteJob(deleteTarget.id)
      setToast({ type: 'success', message: `"${deleteTarget.title}" deleted successfully.` })
      fetchJobs()
    } catch {
      setToast({ type: 'error', message: 'Failed to delete job.' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading || candidatesLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message={error} onRetry={fetchJobs} />

  // Filter jobs
  const filtered = jobs.filter((j) => {
    const matchSearch =
      !searchQuery ||
      j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && j.is_active && j.status === 'Published') ||
      (statusFilter === 'DRAFT' && j.status === 'Draft') ||
      (statusFilter === 'CLOSED' && !j.is_active)
    return matchSearch && matchStatus
  })

  // Summary counts for header
  const activeCount = jobs.filter((j) => j.is_active && j.status === 'Published').length
  const draftCount = jobs.filter((j) => j.status === 'Draft').length
  const closedCount = jobs.filter((j) => !j.is_active).length
  const totalApps = jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0)

  const initials = (company?.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Job Posting"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />

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
                Company Jobs
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                All job postings for {company?.name || 'your organization'}
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 group"
        >
          <Plus className="w-4 h-4" />
          Post New Job
        </Link>
      </div>

      <CompanySubNav />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: activeCount, color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
          { label: 'Draft Jobs', value: draftCount, color: 'bg-amber-50 border-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
          { label: 'Closed Jobs', value: closedCount, color: 'bg-red-50 border-red-100', text: 'text-red-600', bar: 'bg-red-500' },
          { label: 'Total Applications', value: totalApps, color: 'bg-brand-50 border-brand-100', text: 'text-brand-700', bar: 'bg-brand-500' },
        ].map(({ label, value, color, text, bar }) => (
          <div key={label} className={`bg-white rounded-2xl border p-5 shadow-sm relative overflow-hidden ${color}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${bar} rounded-t-2xl opacity-70`} />
            <p className="text-xs font-medium text-surface-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold font-display tracking-tight ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or location…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'DRAFT', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-12 text-center space-y-3">
          <BriefcaseBusiness className="w-10 h-10 text-surface-300 mx-auto" strokeWidth={1.5} />
          <p className="text-sm font-bold text-surface-500">No jobs found</p>
          <p className="text-xs text-surface-400">
            {searchQuery ? 'Try a different search term.' : 'Post your first job to get started.'}
          </p>
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Post New Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-surface-100 shadow-card hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Status accent bar */}
              <div
                className={`h-1 w-full ${
                  !job.is_active ? 'bg-surface-200' :
                  job.status === 'Published' ? 'bg-emerald-500' :
                  'bg-amber-400'
                }`}
              />

              <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">

                {/* Left: Job Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-surface-900 group-hover:text-brand-700 transition-colors">
                      {job.title}
                    </h3>
                    <JobStatusPill status={job.status} isActive={job.is_active} />
                    <span className="text-[10px] font-bold bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full uppercase">
                      {job.employment_type || 'Full-time'}
                    </span>
                    <span className="text-[10px] font-bold bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full uppercase">
                      {job.experience}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 font-medium text-surface-700">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {/* Skill tags */}
                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.skills.slice(0, 5).map((s) => (
                        <span key={s} className="text-[9px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md border border-brand-100 uppercase tracking-wide">
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="text-[9px] text-surface-400">+{job.skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: Metrics */}
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <MetricBadge icon={Users} value={job.applicationsCount} label="Apps" color="bg-blue-50 text-blue-700" />
                  <MetricBadge icon={Mic} value={job.interviewsCount} label="Interviews" color="bg-purple-50 text-purple-700" />
                  <MetricBadge icon={UserCheck} value={job.hiresCount} label="Hired" color="bg-emerald-50 text-emerald-700" />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 border-l border-surface-100 lg:pl-4 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(job)}
                    title={job.is_active ? 'Close Job' : 'Re-open Job'}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      job.is_active
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {job.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>

                  <Link
                    to={`/recruiter/jobs/edit/${job.id}`}
                    title="Edit Job"
                    className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setDeleteTarget(job)}
                    title="Delete Job"
                    className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer count */}
      <p className="text-xs text-surface-400 text-center">
        Showing {filtered.length} of {jobs.length} job postings
      </p>

    </div>
  )
}

export default CompanyJobsPage
