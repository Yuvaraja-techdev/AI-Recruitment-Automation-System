import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Bookmark,
  CheckCircle,
  X,
  AlertCircle,
  BriefcaseBusiness,
  TrendingDown,
  Sparkles,
} from 'lucide-react'
import { getSavedJobs, unsaveJob, getCandidateById, applyForJob } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import JobCard from '../components/JobCard'

const SavedJobsPage = () => {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [candidateDetails, setCandidateDetails] = useState(null)
  
  // Search & Sort states
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('DATE_SAVED') // 'DATE_SAVED' | 'MATCH' | 'SALARY'
  
  // Application modal overlay target
  const [selectedJob, setSelectedJob] = useState(null)
  const [applying, setApplying] = useState(false)
  const [toast, setToast] = useState(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const userString = localStorage.getItem('user')
      let skills = []
      if (userString) {
        const user = JSON.parse(userString)
        if (user.candidate_id) {
          const details = await getCandidateById(user.candidate_id)
          setCandidateDetails(details)
          skills = details.skills || []
        }
      }
      const data = await getSavedJobs()
      setSavedJobs(data)
    } catch (err) {
      setError('Failed to fetch bookmarked jobs. Please check connection to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Toggle bookmark handler (specifically unsaves from this screen)
  const handleRemoveBookmark = async (jobId) => {
    try {
      await unsaveJob(jobId)
      setSavedJobs(prev => prev.filter(job => job.id !== jobId))
      setToast({ type: 'success', message: 'Bookmark removed successfully.' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to remove bookmark.' })
    }
  }

  const handleApplyClick = (job) => {
    setSelectedJob(job)
  }

  const handleConfirmApplication = async () => {
    const userString = localStorage.getItem('user')
    if (!userString) return
    const user = JSON.parse(userString)

    if (!user.candidate_id) {
      alert("Recruiter and Admin accounts cannot apply for jobs. Please log in as a Candidate.")
      return
    }
    
    if (!candidateDetails?.resume || !candidateDetails.resume.trim()) {
      alert("Please upload a resume in your profile page before submitting applications.")
      return
    }

    setApplying(true)
    try {
      await applyForJob(selectedJob.id)
      setToast({ type: 'success', message: 'Application successfully submitted and screened!' })
      setSelectedJob(null)
      // Refetch candidate status
      const details = await getCandidateById(user.candidate_id)
      setCandidateDetails(details)
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application.")
    } finally {
      setApplying(false)
    }
  }

  // Calculate Match Score locally
  const getMatchScore = (jobSkills) => {
    if (!jobSkills || jobSkills.length === 0) return 80
    const candidateSkills = candidateDetails?.skills || []
    if (candidateSkills.length === 0) return 60
    const jobSet = new Set(jobSkills.map(s => s.toLowerCase()))
    const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase()))
    let matches = 0
    jobSet.forEach(s => {
      if (candidateSet.has(s)) matches++
    })
    return Math.min(Math.max(Math.round((matches / jobSet.size) * 100), 55), 99)
  }

  // Parse salary string to float for sorting
  const parseSalary = (salaryStr) => {
    if (!salaryStr) return 0
    // e.g. "$140k - $170k" -> extract first digit sequence
    const matches = salaryStr.replace(/[^\d]/g, '')
    return matches ? parseInt(matches) : 0
  }

  // Filter and Sort Saved Jobs
  const filtered = savedJobs.filter((job) => {
    const matchSearch =
      !search.trim() ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.toLowerCase().includes(search.toLowerCase()) ||
      job.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
    return matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'MATCH') {
      return getMatchScore(b.skills) - getMatchScore(a.skills)
    }
    if (sortBy === 'SALARY') {
      return parseSalary(b.salary) - parseSalary(a.salary)
    }
    // Default: chronological by database order (ID descending / saved recent first)
    return b.id - a.id
  })

  if (loading) return <LoadingSkeleton type="analytics" />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 relative">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/jobs"
            className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Board
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-xs font-bold text-brand-650 hover:underline">
              My Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 mt-8 w-full space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black font-display text-surface-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-brand-600 fill-current" />
              Saved Job Positions
            </h1>
            <p className="text-xs text-surface-400 mt-1">
              Track and evaluate jobs you have saved for later review
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-50 border border-brand-200 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-100 transition-all shadow-sm"
          >
            Browse More Jobs
          </Link>
        </div>

        {/* Search and Sort controls */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved positions by title, company, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-surface-850 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="DATE_SAVED">Recently Saved</option>
              <option value="MATCH">AI Match Rating</option>
              <option value="SALARY">Expected Salary</option>
            </select>
          </div>
        </div>

        {/* Bookmarks List */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-150 rounded-2xl space-y-3">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No saved positions found</p>
            <p className="text-xs text-slate-450">
              {search ? 'No jobs match your search filters.' : 'Bookmark interesting roles inside the job board to find them here.'}
            </p>
            {!search && (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-sm"
              >
                Find Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isBookmarked={true}
                candidateSkills={candidateDetails?.skills || []}
                onBookmarkToggle={handleRemoveBookmark}
                onApply={handleApplyClick}
                showRemoveLabel={true}
              />
            ))}
          </div>
        )}

      </main>

      {/* Application Confirmation Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-650 uppercase tracking-widest block font-display">Confirm Application</span>
                <h3 className="text-base font-extrabold text-surface-900 tracking-tight font-display">
                  {selectedJob.title}
                </h3>
                <p className="text-xs text-surface-500">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow text-xs leading-relaxed text-slate-650">
              {!candidateDetails?.resume || !candidateDetails.resume.trim() ? (
                <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 space-y-2 text-amber-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                    Resume Required
                  </h4>
                  <p className="text-[11px] leading-normal">
                    You must upload your resume in the profile section before submitting applications.
                  </p>
                  <Link to="/profile" className="text-[10px] font-bold text-brand-650 hover:underline block">
                    Go upload resume →
                  </Link>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-bold text-surface-900 uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Applicant Information
                  </h4>
                  <p className="text-[11px]">
                    Submitting application for <span className="font-bold text-slate-800">{candidateDetails.name}</span> (<span className="font-semibold">{candidateDetails.email}</span>).
                  </p>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    By submitting, our AI engine will analyze your resume against this job requirement, compute your ATS Match %, and route it directly to the recruiter board.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              {candidateDetails?.resume && (
                <button
                  type="button"
                  onClick={handleConfirmApplication}
                  disabled={applying}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {applying ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SavedJobsPage
