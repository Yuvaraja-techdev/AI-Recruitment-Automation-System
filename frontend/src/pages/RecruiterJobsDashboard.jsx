import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  BriefcaseBusiness,
  Users,
  Calendar,
  UserCheck,
  UserX,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  PieChart as PieIcon,
  BarChart as BarIcon,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { getAllJobs, updateJob, deleteJob } from '../services/api'
import useCandidates from '../hooks/useCandidates'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'

// Visual Color constants
const COLORS = {
  PUBLISHED: '#10b981', // emerald
  DRAFT: '#f59e0b', // amber
  CLOSED: '#ef4444', // red
  PRIMARY: '#6366f1', // indigo
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
  fontSize: '13px',
  padding: '8px 14px',
}

function RecruiterJobsDashboard() {
  const { candidates, loading: candidatesLoading, error: candidatesError, stats: candidateStats } = useCandidates()

  // Real backend jobs list states
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState('')

  // UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Fetch jobs function
  const fetchJobs = async () => {
    setJobsLoading(true)
    setJobsError('')
    try {
      const data = await getAllJobs({ status: 'ALL' })

      // Map applications count and interviews count directly from candidate records
      const mappedJobs = data.map((job) => {
        const matchingCandidates = candidates.filter(
          (c) => c.applied_role?.toLowerCase() === job.title?.toLowerCase()
        )
        return {
          ...job,
          applicationsCount: matchingCandidates.length,
          interviewsCount: matchingCandidates.filter((c) => c.status?.toUpperCase() === 'INTERVIEWING').length,
          experience: job.experience || 'Mid',
          type: job.employment_type || 'Full-time',
        }
      })

      setJobs(mappedJobs)
    } catch (err) {
      console.error(err)
      setJobsError('Failed to retrieve job postings from backend.')
    } finally {
      setJobsLoading(false)
    }
  }

  // Fetch jobs once candidates are loaded
  useEffect(() => {
    if (!candidatesLoading) {
      fetchJobs()
    }
  }, [candidatesLoading, candidates])

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (candidatesLoading || jobsLoading) {
    return <LoadingSpinner message="Loading jobs workspace..." />
  }

  if (candidatesError || jobsError) {
    return <ErrorState message={candidatesError || jobsError} onRetry={fetchJobs} />
  }

  // Toggle Publish / Unpublish Status in backend
  const handleTogglePublish = async (jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    const nextStatus = job.status === 'Published' ? 'Draft' : 'Published'
    try {
      await updateJob(jobId, { status: nextStatus })
      setToast({
        message: `Job status updated to "${nextStatus}" successfully!`,
        type: 'success',
      })
      fetchJobs()
    } catch (err) {
      alert('Failed to update job status in backend.')
    }
  }

  // Toggle Active State in backend
  const handleToggleActive = async (jobId) => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    const nextActive = job.is_active === false ? true : false
    try {
      await updateJob(jobId, { is_active: nextActive })
      setToast({
        message: `Job posting set to ${nextActive ? 'Active' : 'Inactive'}`,
        type: 'success',
      })
      fetchJobs()
    } catch (err) {
      alert('Failed to update job active state in backend.')
    }
  }

  // Request deletion
  const handleDeleteRequest = (job) => {
    setDeleteTarget(job)
  }

  // Confirm delete in backend
  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await deleteJob(deleteTarget.id)
      setToast({
        message: `Successfully deleted job posting "${deleteTarget.title}"`,
        type: 'success',
      })
      fetchJobs()
    } catch (err) {
      alert('Failed to delete job posting.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Filtering Logic
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      job.title.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q)

    if (statusFilter === 'ALL') return matchesSearch
    return job.status.toUpperCase() === statusFilter.toUpperCase() && matchesSearch
  })

  // Metrics Calculations
  const activeJobsCount = jobs.filter((j) => j.status === 'Published').length
  const draftJobsCount = jobs.filter((j) => j.status === 'Draft').length
  const closedJobsCount = jobs.filter((j) => j.status === 'Closed').length

  const totalApplicationsCount = candidateStats.total
  const selectedCount = candidateStats.selected
  const rejectedCount = candidateStats.rejected
  const interviewsCount = candidates.filter((c) => c.status?.toUpperCase() === 'INTERVIEWING').length

  // Chart data definitions
  const pieData = [
    { name: 'Active', value: activeJobsCount, color: COLORS.PUBLISHED },
    { name: 'Draft', value: draftJobsCount, color: COLORS.DRAFT },
    { name: 'Closed', value: closedJobsCount, color: COLORS.CLOSED },
  ].filter((d) => d.value > 0)

  const barData = jobs.map((job) => ({
    name: job.title.length > 20 ? job.title.slice(0, 18) + '...' : job.title,
    applications: job.applicationsCount || 0,
    interviews: job.interviewsCount || 0,
  }))

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
            Job Management
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Manage open positions, draft templates, and applicant metrics
          </p>
        </div>
        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-md shadow-brand-600/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Job Posting
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatWidget icon={Briefcase} label="Total Jobs" value={jobs.length} color="text-brand-600" bg="bg-brand-50" />
        <StatWidget icon={CheckCircle} label="Active Jobs" value={activeJobsCount} color="text-emerald-600" bg="bg-emerald-50" />
        <StatWidget icon={AlertCircle} label="Draft Jobs" value={draftJobsCount} color="text-amber-600" bg="bg-amber-50" />
        <StatWidget icon={XCircle} label="Closed Jobs" value={closedJobsCount} color="text-red-650" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatWidget icon={Users} label="Total Applications" value={totalApplicationsCount} color="text-indigo-600" bg="bg-indigo-50" />
        <StatWidget icon={Calendar} label="Interviews Scheduled" value={interviewsCount} color="text-purple-600" bg="bg-purple-50" />
        <StatWidget icon={UserCheck} label="Selected Candidates" value={selectedCount} color="text-emerald-650" bg="bg-emerald-100/50" />
        <StatWidget icon={UserX} label="Rejected Candidates" value={rejectedCount} color="text-slate-550" bg="bg-slate-100" />
      </div>

      {/* Analytics Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Breakdown (Pie) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-150 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-50">
              <PieIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-display text-surface-900">Job Status Mix</h3>
              <p className="text-[10px] text-surface-400">Ratio of active, draft and closed posts</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-center text-surface-400 py-16">No status mix to display</p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-t-surface-100 text-center text-[10px] font-bold">
            <div className="text-emerald-700 bg-emerald-50 rounded-xl py-1">Active: {activeJobsCount}</div>
            <div className="text-amber-700 bg-amber-50 rounded-xl py-1">Draft: {draftJobsCount}</div>
            <div className="text-red-700 bg-red-50 rounded-xl py-1">Closed: {closedJobsCount}</div>
          </div>
        </div>

        {/* Applications Count per Job (Bar) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-surface-150 p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50">
              <BarIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-display text-surface-900">Applications per Role</h3>
              <p className="text-[10px] text-surface-400">Total applications against scheduled verbal evaluations</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="applications" fill="#6366f1" radius={[4, 4, 0, 0]} name="Applications" />
                <Bar dataKey="interviews" fill="#a855f7" radius={[4, 4, 0, 0]} name="Interviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Jobs Listing Table Card */}
      <div className="bg-white rounded-2xl border border-surface-150 shadow-card overflow-hidden">
        {/* Search / Filter header bar */}
        <div className="p-5 border-b border-surface-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-extrabold text-surface-900 font-display flex items-center gap-2">
            <BriefcaseBusiness className="w-4.5 h-4.5 text-brand-600" />
            Recent Job Postings
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search job title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-surface-100 rounded-lg p-0.5 text-xs font-bold w-full sm:w-auto">
              {['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === f
                      ? 'bg-white text-surface-850 shadow-sm'
                      : 'text-surface-450 hover:text-surface-650'
                  }`}
                >
                  {f.replace(/^\w/, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-150 text-[10px] font-bold text-surface-400 bg-slate-50 uppercase tracking-wider">
                <th className="px-6 py-3.5">Job Details</th>
                <th className="px-6 py-3.5">Job Status</th>
                <th className="px-6 py-3.5 text-center">Active</th>
                <th className="px-6 py-3.5 text-center">Applications</th>
                <th className="px-6 py-3.5 text-center">Interviews</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-xs text-surface-400 font-medium bg-white">
                    No matching job postings found. Create a new posting to get started.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="group hover:bg-slate-50/40 transition-colors">
                    {/* Job metadata */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-surface-900 group-hover:text-brand-650 transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-[10px] text-surface-450">
                          {job.company} • <span className="font-semibold">{job.location}</span>
                        </p>
                        <div className="flex gap-1.5 text-[9px] font-bold pt-0.5">
                          <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded font-mono">
                            {job.type}
                          </span>
                          <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded font-mono">
                            {job.experience} Experience
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Job Status badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>

                    {/* Active/Inactive Toggle Switch */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(job.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          job.is_active !== false ? 'bg-emerald-500' : 'bg-surface-300'
                        }`}
                        title={job.is_active !== false ? 'Deactivate Posting' : 'Activate Posting'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                            job.is_active !== false ? 'translate-x-4.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Applications Count */}
                    <td className="px-6 py-4 text-center font-mono text-xs font-extrabold text-surface-800">
                      {job.applicationsCount}
                    </td>

                    {/* Interviews Count */}
                    <td className="px-6 py-4 text-center font-mono text-xs font-extrabold text-surface-800">
                      {job.interviewsCount}
                    </td>

                    {/* Controls Actions Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/recruiter/jobs/applicants?jobId=${job.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-brand-50 hover:bg-brand-100 text-brand-770 transition-colors flex items-center gap-1"
                          title="View applicants"
                        >
                          <Users className="w-3 h-3" /> Candidates
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(job.id)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            job.status === 'Published'
                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-750'
                          }`}
                          title={job.status === 'Published' ? 'Unpublish (Draft)' : 'Publish'}
                        >
                          {job.status === 'Published' ? 'Draft' : 'Publish'}
                        </button>

                        <Link
                          to={`/recruiter/jobs/edit/${job.id}`}
                          className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit Job Posting"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleDeleteRequest(job)}
                          className="p-1.5 rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Job Posting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal for delete */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Posting"
        message={`Are you sure you want to permanently delete the job posting "${deleteTarget?.title}"? All applicant connections for this job will be severed. This action cannot be undone.`}
        confirmText="Confirm Delete"
        loading={deleting}
      />

      {/* Custom Alert Toasters */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-250 shadow-xl text-sm font-semibold shadow-emerald-500/5 max-w-sm w-full sm:w-auto"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Reusable micro-stat card
const StatWidget = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl border border-surface-150 p-5 shadow-card">
    <div className="flex items-center gap-3.5">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
      </div>
      <div>
        <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
        <p className="text-xs text-surface-400 font-semibold">{label}</p>
      </div>
    </div>
  </div>
)

export default RecruiterJobsDashboard
