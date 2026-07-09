import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  ArrowLeft,
  X,
  BriefcaseBusiness,
  Building,
  CheckCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Filter,
  Sparkles
} from 'lucide-react'
import { getAllJobs, getCandidateById, applyForJob, getSavedJobs, saveJob, unsaveJob, getJobRecommendations } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import JobCard from '../components/JobCard'

function JobPortalPage() {
  const navigate = useNavigate()
  
  // API and UI list states
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter values
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('') // '' | 'Entry' | 'Mid' | 'Senior'
  
  // Bookmark state (caching job IDs in localStorage)
  const [bookmarks, setBookmarks] = useState([])

  // Modal target
  const [selectedJob, setSelectedJob] = useState(null)
  
  // Profile check
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const refreshRecs = useCallback(async () => {
    try {
      const data = await getJobRecommendations()
      setRecommendations(data)
    } catch (e) {
      console.error("Failed to load recommendations:", e)
    }
  }, [])

  // Load user data & bookmarks
  useEffect(() => {
    const fetchCandidateData = async () => {
      const userString = localStorage.getItem('user')
      if (userString) {
        try {
          const user = JSON.parse(userString)
          setCandidateProfile(user)
          
          if (user.candidate_id) {
            const [details, saved, recs] = await Promise.all([
              getCandidateById(user.candidate_id),
              getSavedJobs(),
              getJobRecommendations()
            ])
            setCandidateDetails(details)
            setBookmarks(saved.map(j => j.job_id))
            setRecommendations(recs)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    fetchCandidateData()
  }, [])

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')

  // Advanced filters state (Module 6)
  const [workModes, setWorkModes] = useState([])
  const [jobTypes, setJobTypes] = useState([])
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [minSalary, setMinSalary] = useState(0)

  // Debounce inputs by 300ms to optimize server calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location)
    }, 300)
    return () => clearTimeout(handler)
  }, [location])

  // Fetch jobs handler
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim()
      if (debouncedLocation.trim()) filters.location = debouncedLocation.trim()
      if (experience) filters.experience = experience
      
      const data = await getAllJobs(filters)
      setJobs(data)
    } catch (err) {
      setError('Failed to retrieve job listings from backend.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, debouncedLocation, experience])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Toggle bookmark handler
  const handleToggleBookmark = async (jobId) => {
    try {
      if (bookmarks.includes(jobId)) {
        await unsaveJob(jobId)
        setBookmarks(prev => prev.filter(id => id !== jobId))
      } else {
        await saveJob(jobId)
        setBookmarks(prev => [...prev, jobId])
      }
      refreshRecs()
    } catch (err) {
      console.error("Failed to toggle bookmark:", err)
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job)
  }

  const handleConfirmApplication = () => {
    if (!candidateProfile?.candidate_id) {
      alert("Recruiter and Admin accounts cannot apply for jobs. Please log in as a Candidate.")
      return
    }
    
    const randomNum = Math.floor(100 + Math.random() * 900)
    const applicationId = `APP${randomNum}`
    navigate(`/apply/${selectedJob.id}`, {
      state: {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        candidateId: candidateProfile.candidate_id,
        applicationId: applicationId
      }
    })
    setSelectedJob(null)
  }

  const uniqueCompanies = Array.from(new Set(jobs.map((j) => j.company).filter(Boolean)))
  const uniqueSkills = Array.from(new Set(jobs.flatMap((j) => j.skills || []).filter(Boolean)))

  const parseSalaryVal = (salaryStr) => {
    if (!salaryStr) return 0
    const match = salaryStr.replace(/[^\d]/g, '')
    return match ? parseInt(match) : 0
  }

  const filteredJobs = jobs.filter((job) => {
    if (workModes.length > 0 && (!job.work_mode || !workModes.includes(job.work_mode))) return false
    if (jobTypes.length > 0 && (!job.employment_type || !jobTypes.includes(job.employment_type))) return false
    if (selectedCompanies.length > 0 && (!job.company || !selectedCompanies.includes(job.company))) return false
    if (selectedSkills.length > 0 && (!job.skills || !job.skills.some(s => selectedSkills.includes(s)))) return false
    if (minSalary > 0 && parseSalaryVal(job.salary) < minSalary) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/saved-jobs"
              className="text-xs font-bold text-slate-550 hover:text-slate-700 transition-colors"
            >
              Saved Jobs
            </Link>
            <Link
              to="/profile"
              className="text-xs font-bold text-brand-650 hover:underline"
            >
              My Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8 w-full space-y-6">
        
        {/* Search header panel */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-surface-900 tracking-tight font-display">
            Browse Active Positions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by keywords, titles, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-850 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by city, state, or remote..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-surface-850 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-indigo-500/20 relative overflow-hidden">
            {/* Ambient decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/25 flex items-center justify-center border border-indigo-400/30">
                  <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight font-display">AI Career Matches For You</h3>
                  <p className="text-[10px] text-indigo-200/70">Personalized positions evaluated by our real-time suitability engine</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest px-2.5 py-1 bg-indigo-500/15 rounded-full border border-indigo-400/20">AI Engine Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map(({ job, reason, match_pct }) => {
                const initials = (job.company || 'C').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                return (
                  <div key={job.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4.5 flex flex-col justify-between gap-4 hover:border-indigo-500/30 transition-all backdrop-blur-md relative group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center font-black text-xs text-indigo-300 border border-indigo-500/30">
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{job.title}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{job.company}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          {match_pct}% Match
                        </span>
                      </div>

                      {/* Recommendation reasoning block */}
                      <div className="bg-indigo-950/40 border border-indigo-500/10 rounded-xl p-2.5 text-[10px] text-indigo-200/90 italic flex items-start gap-1.5 leading-relaxed">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 font-semibold">{job.location}</span>
                      <button
                        type="button"
                        onClick={() => handleApplyClick(job)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Sidebar Filters */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-brand-500" />
                Filter Results
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setLocation('')
                  setExperience('')
                  setWorkModes([])
                  setJobTypes([])
                  setSelectedCompanies([])
                  setSelectedSkills([])
                  setMinSalary(0)
                }}
                className="text-[10px] font-bold text-brand-650 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Experience level selectors */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Experience Level</span>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'All Levels', value: '' },
                  { label: 'Entry Level', value: 'Entry' },
                  { label: 'Mid Level', value: 'Mid' },
                  { label: 'Senior Level', value: 'Senior' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      experience === opt.value
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Mode filters */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Work Mode</span>
              <div className="space-y-1.5">
                {['Remote', 'Hybrid', 'Onsite'].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-xs text-slate-650 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workModes.includes(mode)}
                      onChange={(e) => {
                        if (e.target.checked) setWorkModes([...workModes, mode])
                        else setWorkModes(workModes.filter(m => m !== mode))
                      }}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            {/* Employment Type filters */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Employment Type</span>
              <div className="space-y-1.5">
                {[
                  { label: 'Full Time', value: 'Full-time' },
                  { label: 'Internship', value: 'Internship' },
                  { label: 'Contract', value: 'Contract' }
                ].map((type) => (
                  <label key={type.value} className="flex items-center gap-2 text-xs text-slate-650 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jobTypes.includes(type.value)}
                      onChange={(e) => {
                        if (e.target.checked) setJobTypes([...jobTypes, type.value])
                        else setJobTypes(jobTypes.filter(t => t !== type.value))
                      }}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Expected Salary Minimum threshold */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Min Salary Threshold</span>
              <select
                value={minSalary}
                onChange={(e) => setMinSalary(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-surface-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={0}>Any Salary</option>
                <option value={60}>$60k+ / year</option>
                <option value={100}>$100k+ / year</option>
                <option value={130}>$130k+ / year</option>
                <option value={150}>$150k+ / year</option>
              </select>
            </div>

            {/* Hiring Companies */}
            {uniqueCompanies.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Companies</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {uniqueCompanies.map((company) => (
                    <label key={company} className="flex items-center gap-2 text-xs text-slate-650 font-medium cursor-pointer truncate">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCompanies([...selectedCompanies, company])
                          else setSelectedCompanies(selectedCompanies.filter(c => c !== company))
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {company}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Technology / Skills tags */}
            {uniqueSkills.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Technologies</span>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
                  {uniqueSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (isSelected) setSelectedSkills(selectedSkills.filter(s => s !== skill))
                          else setSelectedSkills([...selectedSkills, skill])
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                          isSelected
                            ? 'bg-brand-600 border-brand-650 text-white'
                            : 'bg-slate-50 border-slate-150 text-slate-550 hover:bg-slate-100'
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bookmarks Counter indicator */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Bookmarked Positions</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-surface-900">{bookmarks.length}</span>
                <span className="text-[10px] text-slate-400 font-bold">roles saved</span>
              </div>
            </div>
          </div>

          {/* Jobs Listing grid */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <LoadingSkeleton type="card" />
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl space-y-2">
                <p className="text-sm font-semibold text-slate-600">No active positions found</p>
                <p className="text-xs text-slate-450">Try adjusting your keyword search or filter checkboxes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isBookmarked={bookmarks.includes(job.id)}
                    candidateSkills={candidateDetails?.skills || []}
                    onBookmarkToggle={handleToggleBookmark}
                    onApply={handleApplyClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 5. Job Details & Application Modal Overlay */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-650 uppercase tracking-widest block">Job Details</span>
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

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-grow text-xs leading-relaxed text-slate-650">
              
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-surface-900 uppercase tracking-wide">Role Description</h4>
                <p>{selectedJob.description}</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-surface-900 uppercase tracking-wide">Role Requirements</h4>
                <p className="whitespace-pre-line">{selectedJob.requirements}</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-surface-900 uppercase tracking-wide">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedJob.skills && selectedJob.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-slate-50 text-slate-650 border border-slate-150 text-[10px] font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confirm Application Info Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-[10px] font-bold text-surface-900 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
                  AI Recruitment Pipeline
                </h4>
                <p className="text-[11px] leading-normal text-slate-650">
                  Applying as <span className="font-bold text-slate-800">{candidateProfile?.name || 'Jane Doe'}</span> (<span className="font-semibold">{candidateProfile?.email || 'jane@example.com'}</span>).
                  Clicking "Confirm Application" will redirect you to our automated n8n Smart Form, prefilled with this job's requirements.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-white border border-slate-250 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleConfirmApplication}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                Confirm Application
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default JobPortalPage
