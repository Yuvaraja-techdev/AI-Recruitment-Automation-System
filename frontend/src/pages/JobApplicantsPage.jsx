import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Award,
  Check,
  X,
  Calendar,
  Eye,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { getMyApplications, getAllCandidates, getAllJobs, updateCandidateStatus } from '../services/api'
import Breadcrumb from '../components/Breadcrumb'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

function JobApplicantsPage() {
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  const navigate = useNavigate()

  // Data states
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    if (!jobId) {
      setError('Missing parameters: jobId is required.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      // 1. Fetch all jobs to find current job context
      const jobsList = await getAllJobs({ status: 'ALL' })
      const currentJob = jobsList.find((j) => String(j.id) === String(jobId))
      
      // Fallback to local storage if job not in backend yet
      if (!currentJob) {
        const cachedJobsString = localStorage.getItem('hireflow_mock_jobs')
        if (cachedJobsString) {
          const cached = JSON.parse(cachedJobsString)
          const target = cached.find((j) => String(j.id) === String(jobId))
          setJob(target)
        }
      } else {
        setJob(currentJob)
      }

      // 2. Fetch all applications
      const apps = await getMyApplications()
      const jobApps = apps.filter((app) => String(app.job_id) === String(jobId))

      // 3. Fetch all candidates profiles
      const candidates = await getAllCandidates()

      // 4. Merge candidates details into job applications list
      const mergedApplicants = jobApps.map((app) => {
        const profile = candidates.find((c) => c.candidate_id === app.candidate_id)
        return {
          ...app,
          candidate: profile || {
            name: 'Candidate User',
            email: 'user@hireflow.ai',
            ats_score: 75,
            status: app.status || 'PENDING',
          },
        }
      })

      setApplicants(mergedApplicants)
    } catch (err) {
      console.error(err)
      setError('Failed to retrieve applicant directory mapping details.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle Candidate status transition changes
  const handleStatusChange = async (candidateId, newStatus) => {
    setActionLoadingId(candidateId)
    try {
      await updateCandidateStatus(candidateId, newStatus)
      
      // Update local state state values
      setApplicants((prev) =>
        prev.map((app) => {
          if (app.candidate_id === candidateId) {
            return {
              ...app,
              status: newStatus,
              candidate: { ...app.candidate, status: newStatus },
            }
          }
          return app
        })
      )
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update applicant state')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filter operations
  const filteredApplicants = applicants.filter((app) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      app.candidate.name.toLowerCase().includes(q) ||
      app.candidate.email.toLowerCase().includes(q) ||
      app.candidate_id.toLowerCase().includes(q)
    
    if (statusFilter === 'ALL') return matchesSearch
    return app.candidate.status.toUpperCase() === statusFilter.toUpperCase() && matchesSearch
  })

  // Format Applied date
  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch (e) {
      return isoString
    }
  }

  const breadcrumbItems = [
    { label: 'Jobs', path: '/recruiter/jobs' },
    { label: 'Applicants' },
  ]

  if (loading) {
    return <LoadingSpinner message="Loading candidate application entries..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-4xl">
      {/* Breadcrumb routing navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header section details */}
      <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-indigo-650" />
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-650 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
            Applicants Directory
          </span>
          <h2 className="text-xl font-bold font-display text-surface-900 mt-1">
            {job?.title || 'Job Opening'}
          </h2>
          <p className="text-xs text-surface-500">
            {job?.company} • <span className="font-semibold">{job?.location}</span>
          </p>
        </div>

        <div className="flex gap-4 text-center">
          <div className="bg-slate-50 border border-surface-200 rounded-xl px-4 py-2 min-w-[90px]">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider block">Applicants</span>
            <span className="text-lg font-black text-surface-850">{applicants.length}</span>
          </div>
          <div className="bg-slate-50 border border-surface-200 rounded-xl px-4 py-2 min-w-[90px]">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider block">Interviewing</span>
            <span className="text-lg font-black text-brand-600">
              {applicants.filter((a) => a.candidate.status?.toUpperCase() === 'INTERVIEWING').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-surface-150 shadow-card overflow-hidden">
        
        {/* Search controls bar */}
        <div className="p-5 border-b border-surface-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
            />
          </div>

          <div className="flex bg-surface-100 rounded-lg p-0.5 text-[10px] font-bold w-full sm:w-auto overflow-x-auto">
            {['ALL', 'PENDING', 'SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-surface-850 shadow-sm'
                    : 'text-surface-450 hover:text-surface-650'
                }`}
              >
                {st.replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Applicants table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-150 text-[10px] font-bold text-surface-400 bg-slate-50 uppercase tracking-wider">
                <th className="px-6 py-3.5">Applicant details</th>
                <th className="px-6 py-3.5">Applied Date</th>
                <th className="px-6 py-3.5 text-center">ATS Score</th>
                <th className="px-6 py-3.5">Recruitment Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 text-xs">
              {filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-surface-400 font-medium bg-white">
                    No applicants match your active criteria search.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((app) => {
                  const candidateStatus = app.candidate.status?.toUpperCase() || 'PENDING'
                  const isActionLoading = actionLoadingId === app.candidate_id
                  
                  return (
                    <tr key={app.id} className="group hover:bg-slate-50/40 transition-colors">
                      {/* Name Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold flex-shrink-0 text-xs">
                            {app.candidate.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-surface-850 leading-none mb-1">
                              {app.candidate.name}
                            </p>
                            <p className="text-[10px] text-surface-450 leading-none">{app.candidate.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-surface-500 font-medium">
                        {formatDate(app.applied_at)}
                      </td>

                      {/* ATS score rating */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-extrabold text-brand-650 bg-brand-50 px-2.5 py-1 rounded-lg">
                          {app.candidate.ats_score || 80}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={app.candidate.status} />
                      </td>

                      {/* Control buttons */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/recruiter/candidates/${app.candidate_id}`}
                            className="p-1.5 rounded-lg text-surface-450 hover:bg-surface-100 hover:text-surface-700 transition-colors"
                            title="View full Profile details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Invite button */}
                          {['PENDING', 'SCREENED'].includes(candidateStatus) && (
                            <button
                              onClick={() => handleStatusChange(app.candidate_id, 'INTERVIEWING')}
                              disabled={isActionLoading}
                              className="px-2 py-1.5 rounded-lg border border-brand-250 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[10px] transition-colors"
                              title="Invite to AI voice interview"
                            >
                              Invite
                            </button>
                          )}

                          {/* Selection outcome buttons */}
                          {['PENDING', 'SCREENED', 'INTERVIEWING'].includes(candidateStatus) && (
                            <>
                              <button
                                onClick={() => handleStatusChange(app.candidate_id, 'SELECTED')}
                                disabled={isActionLoading}
                                className="p-1 rounded-lg border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Accept & Shortlist Candidate"
                              >
                                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(app.candidate_id, 'REJECTED')}
                                disabled={isActionLoading}
                                className="p-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 transition-colors"
                                title="Reject Candidate"
                              >
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                            </>
                          )}

                          {isActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-surface-400" />}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default JobApplicantsPage
