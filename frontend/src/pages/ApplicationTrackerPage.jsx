import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  Clock,
  Mic,
  Award,
  AlertCircle,
  XCircle,
  Calendar,
  Building,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMyApplications, getCandidateById, getInterviewSlots } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function ApplicationTrackerPage() {
  const navigate = useNavigate()
  
  // List states
  const [applications, setApplications] = useState([])
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [interviewTime, setInterviewTime] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Accordion state for timeline toggles (indexed by application ID)
  const [expandedTimelineId, setExpandedTimelineId] = useState(null)

  useEffect(() => {
    const fetchTrackerData = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        
        // Fetch candidate details
        let details = null
        if (user.candidate_id) {
          details = await getCandidateById(user.candidate_id)
          setCandidateDetails(details)
        }

        // Fetch applications
        const apps = await getMyApplications()
        setApplications(apps)

        // Fetch Booked Interview Slot
        if (user.candidate_id) {
          const slots = await getInterviewSlots()
          const mySlot = slots.find((s) => s.booked_by_candidate_id === user.candidate_id)
          if (mySlot) {
            setInterviewTime(mySlot.slot_time)
          }
        }
      } catch (err) {
        setError('Failed to load application tracker data.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrackerData()
  }, [navigate])

  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (e) {
      return isoString
    }
  }

  const getCompanyInitials = (name) => {
    if (!name) return 'HF'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Get dynamic logo color gradients based on company name hash
  const getCompanyColor = (name) => {
    if (!name) return 'from-brand-500 to-indigo-600'
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-650',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const idx = Math.abs(hash) % colors.length
    return colors[idx]
  }

  // Dynamically calculate status counts
  const totalCount = applications.length
  const screeningCount = applications.filter((a) => a.status === 'PENDING').length
  const scheduledCount = (candidateDetails?.status === 'INTERVIEWING' && interviewTime) ? 1 : 0
  const completedCount = (candidateDetails?.overall_score !== null && candidateDetails?.overall_score !== undefined) ? 1 : 0
  const selectedCount = candidateDetails?.status === 'SELECTED' ? 1 : 0
  const rejectedCount = candidateDetails?.status === 'REJECTED' ? 1 : 0

  // Calculate timeline steps dynamically
  const getTimelineSteps = (candidateStatus) => {
    const status = candidateStatus || 'PENDING'
    
    return [
      {
        title: 'Application Submitted',
        desc: 'Profile received & registered in screening workflows.',
        isCompleted: true,
        isActive: false
      },
      {
        title: 'AI Resume Screening',
        desc: 'Reviewing ATS matching benchmarks and capability gaps.',
        isCompleted: ['SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].includes(status),
        isActive: status === 'PENDING'
      },
      {
        title: 'Voice Assessment scheduled',
        desc: interviewTime ? `Booked for ${interviewTime}` : 'Invite shared with candidate.',
        isCompleted: !!interviewTime || ['SELECTED', 'REJECTED'].includes(status),
        isActive: ['SCREENED', 'INTERVIEWING'].includes(status) && !interviewTime
      },
      {
        title: 'AI Voice Interview',
        desc: candidateDetails?.overall_score 
          ? `Finished with score ${candidateDetails.overall_score}/10.`
          : 'Interactive interview session.',
        isCompleted: !!candidateDetails?.overall_score || ['SELECTED', 'REJECTED'].includes(status),
        isActive: ['SCREENED', 'INTERVIEWING'].includes(status) && !!interviewTime
      },
      {
        title: 'Selection Outcome',
        desc: status === 'SELECTED' 
          ? 'Selected! Offer letter generated.' 
          : status === 'REJECTED' 
          ? 'Application closed.' 
          : 'Recruiter final decision.',
        isCompleted: ['SELECTED', 'REJECTED'].includes(status),
        isActive: ['SELECTED', 'REJECTED'].includes(status)
      }
    ]
  }

  const steps = getTimelineSteps(candidateDetails?.status)

  const handleWithdraw = (jobTitle) => {
    const ok = window.confirm(`Are you sure you want to withdraw your application for ${jobTitle}? This action cannot be undone.`)
    if (ok) {
      alert("Application withdrawal request submitted successfully.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-xs font-bold text-slate-550 hover:underline">
              My Profile
            </Link>
            <Link to="/jobs" className="text-xs font-bold text-slate-550 hover:underline">
              Search Jobs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8 flex-grow w-full">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-surface-900 tracking-tight font-display">
            Candidate Application Suite
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor screening outcomes, interview schedules, and active application statuses.
          </p>
        </div>

        {/* Summary counts panel */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryWidget title="Total Apps" count={totalCount} icon={Briefcase} color="border-l-4 border-l-slate-400" />
          <SummaryWidget title="Screening" count={screeningCount} icon={Cpu} color="border-l-4 border-l-amber-500 text-amber-700" />
          <SummaryWidget title="Scheduled" count={scheduledCount} icon={Calendar} color="border-l-4 border-l-indigo-500 text-indigo-700" />
          <SummaryWidget title="Completed" count={completedCount} icon={CheckCircle2} color="border-l-4 border-l-purple-500 text-purple-700" />
          <SummaryWidget title="Selected" count={selectedCount} icon={Award} color="border-l-4 border-l-emerald-500 text-emerald-700" />
          <SummaryWidget title="Rejected" count={rejectedCount} icon={XCircle} color="border-l-4 border-l-red-500 text-red-700" />
        </div>

        {loading ? (
          <LoadingSkeleton type="timeline" />
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {applications.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No active applications found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
                    You haven't submitted any job applications yet. Browse open developer roles to start applying.
                  </p>
                </div>
                <Link
                  to="/jobs"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm inline-block"
                >
                  Browse Open Positions
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                  My Recent Applications
                </h3>

                <div className="space-y-4">
                  {applications.map((app) => {
                    const isActiveJob = app.job_title === candidateDetails?.applied_role
                    const currentStatus = isActiveJob ? candidateDetails?.status : app.status
                    const hasInterviewActive = isActiveJob && ['SCREENED', 'INTERVIEWING'].includes(candidateDetails?.status)
                    const isExpanded = expandedTimelineId === app.id

                    return (
                      <div
                        key={app.id}
                        className={`bg-white border rounded-2xl shadow-card overflow-hidden border-l-4 transition-all duration-300 ${
                          currentStatus === 'SELECTED'
                            ? 'border-l-emerald-500 border-emerald-100'
                            : currentStatus === 'REJECTED'
                            ? 'border-l-red-500 border-red-100'
                            : 'border-l-brand-600 border-surface-150'
                        }`}
                      >
                        {/* Application metadata banner */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            {/* Initials Logo */}
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getCompanyColor(
                              app.job_company
                            )} flex items-center justify-center text-white text-base font-bold shadow-md shadow-brand-500/5 flex-shrink-0`}>
                              {getCompanyInitials(app.job_company)}
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-base font-extrabold text-surface-900 tracking-tight font-display">
                                {app.job_title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-450">
                                <span className="font-semibold text-slate-700">
                                  {app.job_company}
                                </span>
                                <span>•</span>
                                <span>Applied: {formatDate(app.applied_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Matching Metrics & Badges */}
                          <div className="flex items-center gap-6">
                            {isActiveJob && candidateDetails?.ats_score && (
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                                  AI Match
                                </span>
                                <span className="text-sm font-black text-brand-600">{candidateDetails.ats_score}%</span>
                              </div>
                            )}

                            <div>
                              {currentStatus === 'SELECTED' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide">
                                  Offer Extended
                                </span>
                              ) : currentStatus === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold uppercase tracking-wide">
                                  Application Closed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wide">
                                  Active Screening
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Accordion Timeline */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                            >
                              <div className="p-6 space-y-6">
                                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                                  Hiring Pipeline Tracking
                                </h4>

                                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                                  {steps.map((step, idx) => (
                                    <div key={idx} className="relative flex gap-3.5 items-start text-xs">
                                      <div className={`absolute -left-[23px] top-0.5 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center z-10 ${
                                        step.isCompleted ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-300'
                                      }`}>
                                        {step.isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                                      </div>
                                      <div>
                                        <h5 className={`font-bold ${step.isCompleted ? 'text-slate-850' : 'text-slate-400'}`}>
                                          {step.title}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                                          {step.desc}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Card Action bar */}
                        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedTimelineId(isExpanded ? null : app.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 text-[10px] font-bold transition-all shadow-sm"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              View Timeline
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate('/applications/' + app.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-350 text-slate-650 text-[10px] font-bold transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasInterviewActive && (
                              <Link
                                to={`/interview/${candidateDetails.candidate_id}`}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-extrabold transition-all shadow-sm uppercase tracking-wider"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                Continue Interview
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => handleWithdraw(app.job_title)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold transition-all border border-red-100"
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  )
}

// Summary Widget Component
const SummaryWidget = ({ title, count, icon: Icon, color }) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-150 flex flex-col justify-between gap-3 transition-all hover:shadow-md ${color}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{title}</span>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <span className="text-2xl font-black font-mono leading-none mt-1">{count}</span>
  </div>
)

export default ApplicationTrackerPage
