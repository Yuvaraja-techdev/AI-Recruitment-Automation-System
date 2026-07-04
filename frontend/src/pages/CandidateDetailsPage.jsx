import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Mail,
  Phone,
  Briefcase,
  FileText,
  Brain,
  User,
  BadgeCheck,
  Hash,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Award,
  Calendar,
  UserCheck,
  Github,
  Linkedin,
  Globe,
  BookOpen,
  Cpu,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getCandidateById,
  updateCandidateStatus,
  updateCandidateProfile,
  getInterviewSlots,
  assignInterviewSlot,
  releaseInterviewSlot,
} from '../services/api'
import Breadcrumb from '../components/Breadcrumb'
import StatusBadge from '../components/StatusBadge'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'

const CandidateDetailsPage = () => {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Status update states
  const [updating, setUpdating] = useState(false)
  const [statusError, setStatusError] = useState(null)

  // Active Tab state
  const [activeTab, setActiveTab] = useState('PROFILE') // 'PROFILE' | 'RESUME' | 'EVALUATION'

  // Recruiter notes states
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [toast, setToast] = useState(null)

  // Scheduler slots states
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState('')

  // Recruiter Decision Center states
  const [verdict, setVerdict] = useState('') // 'Shortlisted' | 'Hold' | 'Rejected'
  const [verdictReason, setVerdictReason] = useState('')
  const [savingVerdict, setSavingVerdict] = useState(false)
  const [isEditingDecision, setIsEditingDecision] = useState(false)

  // Audio Playback simulation states
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null) // { id: number, type: 'Q' | 'A' }

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Stop any speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCandidateById(id)
      setCandidate(data)
      setRecruiterNotes(data.recruiter_notes || '')
      setVerdict(data.recruiter_verdict || '')
      setVerdictReason(data.recruiter_verdict_reason || '')
      setIsEditingDecision(!data.recruiter_verdict)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Candidate not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCandidate()
  }, [fetchCandidate])

  // Fetch slots list when Evaluation tab is selected
  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true)
    try {
      const data = await getInterviewSlots()
      setSlots(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'EVALUATION') {
      fetchSlots()
    }
  }, [activeTab, fetchSlots])

  const handleStatusChange = async (newStatus) => {
    if (!candidate) return

    const previousStatus = candidate.status
    
    // Optimistic Update: instantly set the state
    setCandidate((prev) => ({ ...prev, status: newStatus }))
    setStatusError(null)
    setUpdating(true)

    try {
      await updateCandidateStatus(candidate.candidate_id, newStatus)
      setToast({
        message: `Status updated to ${newStatus} successfully!`,
        type: 'success',
      })
    } catch (err) {
      // Revert status on failure
      setCandidate((prev) => ({ ...prev, status: previousStatus }))
      setStatusError(err.response?.data?.detail || err.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  // Save Recruiter Notes Handler
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateCandidateProfile(candidate.candidate_id, { recruiter_notes: recruiterNotes })
      setToast({
        message: 'Internal notes saved successfully!',
        type: 'success',
      })
      setCandidate((prev) => ({ ...prev, recruiter_notes: recruiterNotes }))
    } catch (err) {
      setToast({
        message: 'Failed to save comments.',
        type: 'error',
      })
    } finally {
      setSavingNotes(false)
    }
  }

  // Save Official Verdict Handler (Decision Center)
  const handleSaveVerdict = async () => {
    if (!verdict) {
      alert('Please select a hiring verdict.')
      return
    }
    setSavingVerdict(true)
    try {
      let newPipelineStatus = candidate.status
      if (verdict === 'Shortlisted') {
        newPipelineStatus = 'SELECTED'
      } else if (verdict === 'Rejected') {
        newPipelineStatus = 'REJECTED'
      } else if (verdict === 'Hold') {
        newPipelineStatus = 'SCREENED'
      }

      await updateCandidateProfile(candidate.candidate_id, {
        recruiter_verdict: verdict,
        recruiter_verdict_reason: verdictReason,
        status: newPipelineStatus,
      })

      setToast({
        message: 'Hiring verdict successfully recorded!',
        type: 'success',
      })

      setCandidate((prev) => ({
        ...prev,
        recruiter_verdict: verdict,
        recruiter_verdict_reason: verdictReason,
        status: newPipelineStatus,
      }))
      setIsEditingDecision(false)
    } catch (err) {
      setToast({
        message: 'Failed to record official decision.',
        type: 'error',
      })
    } finally {
      setSavingVerdict(false)
    }
  }

  // Assign manually
  const handleAssignSlot = async () => {
    if (!selectedSlotId) return
    try {
      await assignInterviewSlot(selectedSlotId, candidate.candidate_id)
      setToast({
        message: 'Interview slot assigned successfully!',
        type: 'success',
      })
      setSelectedSlotId('')
      fetchSlots()
      // Refresh candidate data to ensure status is synced
      const data = await getCandidateById(id)
      setCandidate(data)
    } catch (err) {
      setToast({
        message: err.response?.data?.detail || 'Failed to assign slot.',
        type: 'error',
      })
    }
  }

  // Release manually
  const handleReleaseSlot = async () => {
    if (!window.confirm('Are you sure you want to cancel and release this slot reservation?')) {
      return
    }
    try {
      await releaseInterviewSlot(candidate.candidate_id)
      setToast({
        message: 'Interview slot reservation released successfully.',
        type: 'success',
      })
      fetchSlots()
      // Refresh candidate data
      const data = await getCandidateById(id)
      setCandidate(data)
    } catch (err) {
      setToast({
        message: 'Failed to release slot.',
        type: 'error',
      })
    }
  }

  // Play audio text-to-speech handler
  const handlePlayAudio = (text, idx, type) => {
    if (!window.speechSynthesis) {
      alert('Your browser does not support text-to-speech audio playback.')
      return
    }

    if (currentlySpeaking && currentlySpeaking.id === idx && currentlySpeaking.type === type) {
      window.speechSynthesis.cancel()
      setCurrentlySpeaking(null)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onend = () => {
      setCurrentlySpeaking(null)
    }
    utterance.onerror = () => {
      setCurrentlySpeaking(null)
    }

    setCurrentlySpeaking({ id: idx, type })
    window.speechSynthesis.speak(utterance)
  }

  if (loading) return <LoadingSkeleton type="details" />
  if (error) return <ErrorState message={error} onRetry={fetchCandidate} />
  if (!candidate) return <ErrorState message="Candidate not found" />

  const statusNormalized = candidate.status?.toUpperCase()

  // Helper to safely parse JSON arrays/lists
  const safeArray = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    try {
      if (typeof val === 'string') {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {}
    return []
  }

  const matchedSkills = safeArray(candidate.matched_skills)
  const education = safeArray(candidate.education)
  const certifications = safeArray(candidate.certifications)
  const experience = safeArray(candidate.experience)
  const projects = safeArray(candidate.projects)
  const interviewLogs = safeArray(candidate.interview_logs)

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Applicants', path: '/recruiter/candidates' },
    { label: candidate.name || id },
  ]

  const renderActionButtons = () => {
    return (
      <div className="flex items-center gap-3">
        <select
          value={candidate.status?.toUpperCase()}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updating}
          className="bg-white border border-surface-200 rounded-xl px-4 py-2 text-xs font-semibold text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all cursor-pointer shadow-sm"
        >
          <option value="PENDING">Pending Review</option>
          <option value="SCREENED">AI Screened</option>
          <option value="INTERVIEWING">Interviewing</option>
          <option value="SELECTED">Shortlisted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {updating && <RefreshCw className="w-4 h-4 animate-spin text-surface-450" />}
      </div>
    )
  }

  // Visual Pipeline Progress Tracker Stepper
  const renderPipelineStepper = () => {
    const statuses = [
      { key: 'PENDING', label: 'Pending Review' },
      { key: 'SCREENED', label: 'AI Screened' },
      { key: 'INTERVIEWING', label: 'Scheduled' },
      { key: 'SELECTED', label: 'Shortlisted' },
    ]

    const currentStatusIndex = statuses.findIndex((s) => s.key === statusNormalized)
    const isRejected = statusNormalized === 'REJECTED'

    return (
      <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
        <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">
          Pipeline Stage Progression
        </span>
        
        {isRejected ? (
          <div className="bg-red-50 border border-red-150 rounded-xl p-3.5 flex items-center gap-3 text-red-800 text-xs">
            <X className="w-5 h-5 text-red-500" strokeWidth={3} />
            <div>
              <span className="font-bold">Applicant Rejected</span>
              <p className="text-[10px] text-red-655 mt-0.5">
                This candidate has been removed from active hiring considerations.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {statuses.map((step, idx) => {
              const isActive = statusNormalized === step.key
              const isPassed = currentStatusIndex >= idx
              return (
                <div key={idx} className="flex items-center flex-1 w-full sm:w-auto relative">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                      isActive
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm ring-4 ring-brand-500/10'
                        : isPassed
                        ? 'bg-brand-100 border-brand-200 text-brand-700'
                        : 'bg-white border-surface-200 text-surface-400'
                    }`}>
                      {isPassed && !isActive ? <Check className="w-3 h-3" strokeWidth={3} /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-bold transition-colors ${
                      isActive ? 'text-surface-900 font-extrabold' : isPassed ? 'text-surface-700' : 'text-surface-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>

                  {idx < statuses.length - 1 && (
                    <div className={`hidden sm:block flex-1 h-[2px] mx-4 rounded-full transition-all ${
                      currentStatusIndex > idx ? 'bg-brand-500' : 'bg-surface-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Resume Preview and AI Resume Intelligence Panel render helper
  const renderResumeTab = () => {
    const missingSkills = safeArray(candidate.missing_skills)
    const strengths = safeArray(candidate.strengths)
    const weaknesses = safeArray(candidate.weaknesses)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
        {/* Left Side: Plain Text preview panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-150 p-6 shadow-card">
          <h2 className="text-base font-semibold font-display text-surface-900 flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-brand-600" />
            Resume Plain Text Preview
          </h2>
          <p className="text-xs text-surface-450 mt-1 mb-4">
            Raw plain text content extracted and parsed by HireFlow screening workflows
          </p>

          {candidate.resume ? (
            <div className="bg-slate-50 border border-surface-200 rounded-xl p-5 font-mono text-[11px] text-surface-650 h-[550px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {candidate.resume}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50 border border-surface-200 rounded-xl">
              <p className="text-xs text-surface-400 font-medium">No plain text resume extracted</p>
            </div>
          )}
        </div>

        {/* Right Side: AI Resume Analysis Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: ATS & AI Recommendation */}
          <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
            <h3 className="text-sm font-semibold font-display text-surface-900 flex items-center gap-2">
              <Brain className="w-4.5 h-4.5 text-brand-600" />
              AI Resume Analysis
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">
                  ATS Score Match
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-brand-600">{candidate.ats_score || 80}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-150">
                  <div 
                    className="bg-brand-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${candidate.ats_score || 80}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                  AI Verdict
                </span>
                <span className={`inline-flex px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase ${
                  candidate.ai_recommendation?.includes('Highly')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                }`}>
                  {candidate.ai_recommendation || 'Recommended'}
                </span>
              </div>
            </div>

            {candidate.resume_filename && (
              <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
                <span className="text-[10px] text-surface-500 font-medium truncate max-w-[150px]">
                  {candidate.resume_filename}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
                    window.open(`${apiBase}/candidates/${candidate.candidate_id}/resume/download`, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold border border-brand-150 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Download File
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Strengths & Weaknesses Analysis */}
          <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
            <h3 className="text-sm font-semibold font-display text-surface-900 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-brand-600" />
              Strengths & Weaknesses
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Strengths */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Strengths
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-surface-650 leading-relaxed">
                  {strengths.length > 0 ? (
                    strengths.map((str, idx) => <li key={idx}>{str}</li>)
                  ) : (
                    <li>Demonstrates core tech stack knowledge aligning with position description guidelines.</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-1.5 pt-2 border-t border-surface-100">
                <span className="text-[10px] font-extrabold text-red-750 bg-red-50 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Targeted Gaps
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-surface-650 leading-relaxed">
                  {weaknesses.length > 0 ? (
                    weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)
                  ) : (
                    <li>Verify candidate's hands-on deployment knowledge during live technical calls.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 3: Skills checklist matching */}
          <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
            <h3 className="text-sm font-semibold font-display text-surface-900 flex items-center gap-2">
              <BadgeCheck className="w-4.5 h-4.5 text-brand-600" />
              Role Skills Checklist Match
            </h3>

            <div className="space-y-3">
              {/* Matched skills */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-surface-450 uppercase font-bold tracking-wide block">Matched Skills ({matchedSkills.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing skills */}
              {missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-surface-100">
                  <span className="text-[9px] text-surface-450 uppercase font-bold tracking-wide block">Missing Requirements ({missingSkills.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-lg bg-slate-50 border border-surface-200 text-surface-500 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // AI Voice Evaluation tab view (Polished for Module 10)
  const renderEvaluationTab = () => {
    const isCompleted = candidate.overall_score !== null && candidate.overall_score !== undefined
    const candidateBooking = slots.find((s) => s.booked_by_candidate_id === candidate.candidate_id)
    const availableSlots = slots.filter((s) => !s.is_booked)

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Manual Slot Assignment Widget */}
        <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-brand-650" />
            <div>
              <h3 className="text-sm font-semibold font-display text-surface-900">
                Evaluation Scheduling Suite
              </h3>
              <p className="text-[10px] text-surface-450 mt-0.5">
                Configure candidate slot dates or clear bookings in real time
              </p>
            </div>
          </div>

          {candidateBooking ? (
            <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-xs">
                <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-extrabold text-emerald-700 block">Scheduled Time Slot Confirmed</span>
                  <span className="text-[11px] text-surface-650 mt-0.5 block">{candidateBooking.slot_time}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReleaseSlot}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-650 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Release Slot
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/40 border border-amber-150 p-4 rounded-xl space-y-3 text-xs">
              <p className="text-amber-800 font-semibold leading-relaxed">
                No interview slot has been reserved for this candidate yet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="flex-1 bg-white border border-surface-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="">-- Assign an Available Slot --</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.slot_time}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignSlot}
                  disabled={!selectedSlotId}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  Assign Slot Manually
                </button>
              </div>
            </div>
          )}
        </div>

        {isCompleted ? (
          <div className="space-y-6">
            {/* Verdict summary */}
            <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold font-display text-surface-900 flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-brand-500" />
                  Voice Evaluation Scoring
                </h3>
                <p className="text-xs text-surface-500">
                  Turn-by-turn answer evaluation completed by HireFlow AI evaluation model
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-2 text-center min-w-[90px]">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">Score</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <span className="text-xl font-extrabold text-brand-600">{candidate.overall_score}</span>
                    <span className="text-[10px] text-surface-400 font-bold">/10</span>
                  </div>
                </div>

                <div className="text-center min-w-[90px]">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-1">Recommendation</span>
                  {candidate.interview_recommendation === 'Selected' ? (
                    <span className="inline-flex bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                      SELECTED
                    </span>
                  ) : candidate.interview_recommendation === 'Hold' ? (
                    <span className="inline-flex bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                      HOLD
                    </span>
                  ) : (
                    <span className="inline-flex bg-red-50 border border-red-200 text-red-750 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                      REJECTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Summary block */}
            <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-3">
              <h3 className="text-xs font-bold text-surface-800 uppercase tracking-wider">AI Assessment Summary</h3>
              <div className="bg-gradient-to-br from-surface-50 to-brand-50/10 rounded-xl p-5 border border-surface-100">
                <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">
                  {candidate.interview_summary}
                </p>
              </div>
            </div>

            {/* Questions Transcript with Audio Playbacks */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">Detailed Transcript Logs</h3>
              <div className="space-y-3">
                {interviewLogs.map((log, index) => {
                  const isSpeakingQ = currentlySpeaking && currentlySpeaking.id === index && currentlySpeaking.type === 'Q'
                  const isSpeakingA = currentlySpeaking && currentlySpeaking.id === index && currentlySpeaking.type === 'A'

                  return (
                    <div key={index} className="bg-white border border-surface-150 rounded-xl p-4 space-y-3 shadow-sm hover:border-surface-250 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-surface-100 pb-2 gap-2">
                        <span className="text-[10px] font-bold text-brand-650 font-mono">QUESTION {index + 1}</span>
                        <div className="flex flex-wrap gap-1">
                          <ScoreBadge label="Tech" value={log.scores?.technical_score} />
                          <ScoreBadge label="Comm" value={log.scores?.communication_score} />
                          <ScoreBadge label="Conf" value={log.scores?.confidence_score} />
                          <ScoreBadge label="Relev" value={log.scores?.relevance_score} />
                        </div>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        {/* Question Speak Block */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-semibold text-surface-900 leading-relaxed">
                              <span className="text-surface-400 font-bold mr-1.5">Q:</span>{log.question}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(log.question, index, 'Q')}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSpeakingQ
                                  ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                                  : 'bg-surface-50 border-surface-200 text-surface-450 hover:text-surface-650'
                              }`}
                              title="Play Question Audio"
                            >
                              <SpeechWaveBouncing active={isSpeakingQ} />
                            </button>
                          </div>
                        </div>

                        {/* Answer Speak Block */}
                        <div className="space-y-1.5 pl-3.5 border-l-2 border-surface-200">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-surface-600 italic leading-relaxed">
                              <span className="text-surface-400 font-bold mr-1.5 not-italic">A:</span>"{log.answer}"
                            </p>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(log.answer, index, 'A')}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSpeakingA
                                  ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                                  : 'bg-surface-50 border-surface-200 text-surface-450 hover:text-surface-650'
                              }`}
                              title="Play Answer Audio"
                            >
                              <SpeechWaveBouncing active={isSpeakingA} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-brand-50/20 text-brand-700 p-3 rounded-xl border border-brand-100 mt-2 text-[11px] leading-relaxed">
                          <span className="font-bold mr-1 text-brand-850">AI Evaluation Feedback:</span>{log.scores?.feedback}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold font-display text-surface-900 flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-surface-400" />
                  AI Voice Interview Pending
                </h3>
                <p className="text-xs text-surface-500">
                  This applicant has not completed the voice-call interview room evaluation yet.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  readOnly 
                  value={`${window.location.origin}/interview/${candidate.candidate_id}`}
                  className="bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-xs font-mono w-48 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/interview/${candidate.candidate_id}`);
                    alert("Interview portal gateway link copied to clipboard!");
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Display generated screening questions */}
            {candidate.interview_logs && candidate.interview_logs.length > 0 && (
              <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
                <h3 className="text-xs font-bold text-surface-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4.5 h-4.5 text-brand-500 animate-pulse" />
                  Generated AI Screening Questionnaire
                </h3>
                <p className="text-[11px] text-surface-450 leading-relaxed">
                  These 5 custom technical questions were generated by the screening model specifically tailored to this candidate's resume and target job requirements.
                </p>
                <div className="space-y-2.5">
                  {candidate.interview_logs.map((q, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-surface-150 p-3 rounded-xl flex items-start gap-2.5">
                      <span className="font-mono text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">Q{idx + 1}</span>
                      <span className="text-xs font-semibold text-slate-700 leading-relaxed">{q.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Vertical timeline rendering helper
  const renderTimeline = () => {
    const isScreened = statusNormalized !== 'PENDING'
    const isInterviewing = ['INTERVIEWING', 'INTERVIEW_SCHEDULED', 'COMPLETED', 'INTERVIEW_COMPLETED', 'SELECTED', 'REJECTED'].includes(statusNormalized)
    const isVerdict = ['SELECTED', 'REJECTED'].includes(statusNormalized)

    const steps = [
      {
        title: 'Application Submitted',
        desc: 'Applicant profile and resume file successfully parsed.',
        icon: UserCheck,
        done: true,
        color: 'text-brand-600 bg-brand-50 border-brand-200',
      },
      {
        title: 'AI Resume Screening',
        desc: isScreened 
          ? `ATS score evaluated: ${candidate.ats_score || 80}% matches keywords.`
          : 'Pending automated requirements scanning.',
        icon: Cpu,
        done: isScreened,
        color: isScreened ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-surface-400 bg-surface-50 border-surface-200',
      },
      {
        title: 'AI Voice Assessment',
        desc: candidate.overall_score 
          ? `Interview finished. Overall rating: ${candidate.overall_score}/10.`
          : isInterviewing 
          ? 'Evaluation room link shared with candidate.' 
          : 'Pending interview invitation.',
        icon: Calendar,
        done: isInterviewing,
        color: isInterviewing ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-surface-400 bg-surface-50 border-surface-200',
      },
      {
        title: 'Verdict Declared',
        desc: isVerdict 
          ? `Applicant officially marked as ${candidate.status} in hiring records.`
          : 'Recruiter final assessment decision pending.',
        icon: Award,
        done: isVerdict,
        color: isVerdict 
          ? statusNormalized === 'SELECTED' 
            ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
            : 'text-red-650 bg-red-50 border-red-200'
          : 'text-surface-400 bg-surface-50 border-surface-200',
      },
    ]

    return (
      <div className="bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-5">
        <h3 className="text-sm font-semibold font-display text-surface-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Applicant Pipeline History
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-surface-200">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="relative flex gap-4 items-start text-xs group">
                {/* Node icon indicator */}
                <div className={`absolute -left-[23px] top-0.5 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                  step.done ? 'bg-brand-500 border-brand-500' : 'bg-white border-surface-300'
                }`}>
                  {step.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                </div>

                <div className="space-y-1 flex-1">
                  <h4 className={`font-bold transition-colors ${step.done ? 'text-surface-850' : 'text-surface-450'}`}>
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-surface-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Error display if status update fails */}
      {statusError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-800">Status Update Failed</h3>
            <p className="text-xs text-red-600 mt-0.5">{statusError}</p>
          </div>
          <button
            onClick={() => setStatusError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-surface-150">
        {/* Status accent bar */}
        <div
          className={`h-1.5 transition-all duration-300 ${
            statusNormalized === 'SELECTED'
              ? 'bg-emerald-500'
              : statusNormalized === 'REJECTED'
              ? 'bg-red-500'
              : 'bg-amber-500'
          }`}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            {candidate.profile_photo ? (
              <img
                src={`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'}/static/${candidate.profile_photo}`}
                alt={candidate.name}
                className="w-16 h-16 rounded-2xl object-cover border border-surface-200 shadow-md shadow-brand-500/10 flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = ''
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20 flex-shrink-0">
                {candidate.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-2xl font-bold font-display text-surface-900 tracking-tight truncate">
                  {candidate.name}
                </h1>
                <StatusBadge status={candidate.status} />
              </div>
              <p className="text-sm text-surface-500">
                <span className="font-mono text-xs bg-surface-100 px-2 py-0.5 rounded mr-2">
                  {candidate.candidate_id}
                </span>
                Applied for{' '}
                <span className="font-semibold text-surface-700">{candidate.applied_role}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Decision Card */}
      <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold font-display text-surface-900 flex items-center gap-2">
            Hiring Decision
          </h2>
          <p className="text-sm text-surface-500">
            Evaluate the profile and update the candidate's position in the hiring pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {renderActionButtons()}
        </div>
      </div>

      {/* Stepper Progress bar */}
      {renderPipelineStepper()}

      {/* Tab Selectors */}
      <div className="flex bg-surface-100 rounded-xl p-1 text-xs font-bold w-full border border-surface-200">
        {[
          { id: 'PROFILE', label: 'Overview & Profile' },
          { id: 'RESUME', label: 'Resume Preview & AI Analysis' },
          { id: 'EVALUATION', label: 'AI Voice Evaluation' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg transition-all text-center ${
              activeTab === tab.id
                ? 'bg-white text-surface-850 shadow-sm border border-surface-150'
                : 'text-surface-450 hover:text-surface-650'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {/* Main split grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in items-start">
            {/* Left side: Contact & Social Info + Vertical Timeline */}
            <div className="lg:col-span-5 space-y-5">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150">
                <h2 className="text-sm font-semibold font-display text-surface-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-500" strokeWidth={2} />
                  Contact & Socials
                </h2>
                <div className="space-y-3.5">
                  <InfoRow icon={Hash} label="Candidate ID" value={candidate.candidate_id} />
                  <InfoRow
                    icon={Mail}
                    label="Email Address"
                    value={candidate.email}
                    href={`mailto:${candidate.email}`}
                  />
                  {candidate.phone_number && (
                    <InfoRow
                      icon={Phone}
                      label="Phone Number"
                      value={candidate.phone_number}
                      href={`tel:${candidate.phone_number}`}
                    />
                  )}
                  <InfoRow icon={Briefcase} label="Applied Role" value={candidate.applied_role} />
                  
                  {/* Social Links */}
                  {candidate.github && (
                    <InfoRow
                      icon={Github}
                      label="GitHub"
                      value={candidate.github}
                      href={`https://github.com/${candidate.github}`}
                    />
                  )}
                  {candidate.linkedin && (
                    <InfoRow
                      icon={Linkedin}
                      label="LinkedIn"
                      value={candidate.linkedin}
                      href={candidate.linkedin}
                    />
                  )}
                  {candidate.portfolio && (
                    <InfoRow
                      icon={Globe}
                      label="Portfolio"
                      value={candidate.portfolio}
                      href={candidate.portfolio}
                    />
                  )}
                </div>
              </div>

              {/* Applicant Timeline Tracker */}
              {renderTimeline()}
            </div>

            {/* Right side: Capability (Skills, Experience, Education) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Matched Skills */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150">
                <h2 className="text-sm font-semibold font-display text-surface-900 mb-4 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-brand-500" strokeWidth={2} />
                  Matched Skills Match
                  {matchedSkills.length > 0 && (
                    <span className="ml-auto text-xs font-semibold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                      {matchedSkills.length} skills
                    </span>
                  )}
                </h2>
                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-100 transition-all hover:bg-brand-100 hover:shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-surface-450 italic">No skills data available</p>
                )}
              </div>

              {/* Academic History & Certifications */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold font-display text-surface-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-500" strokeWidth={2} />
                    Education & Academics
                  </h2>
                  {education.length > 0 ? (
                    <div className="space-y-2.5">
                      {education.map((edu, idx) => (
                        <div key={idx} className="bg-surface-50 border border-surface-150 p-3 rounded-xl">
                          <h4 className="text-xs font-bold text-surface-850">{edu.degree}</h4>
                          <p className="text-[10px] text-surface-500 mt-0.5">{edu.school} • {edu.year}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-450 italic">No academic history listed.</p>
                  )}
                </div>

                <div className="border-t border-surface-100 pt-3.5">
                  <h2 className="text-sm font-semibold font-display text-surface-900 mb-3 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-brand-500" strokeWidth={2} />
                    Certifications
                  </h2>
                  {certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((cert, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold">
                          {cert}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-450 italic">No certifications listed.</p>
                  )}
                </div>
              </div>

              {/* Professional Experience & Projects */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold font-display text-surface-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4.5 h-4.5 text-brand-500" strokeWidth={2} />
                    Employment History
                  </h2>
                  {experience.length > 0 ? (
                    <div className="space-y-2.5">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="bg-surface-50 border border-surface-150 p-3 rounded-xl">
                          <h4 className="text-xs font-bold text-surface-850">{exp.role}</h4>
                          <p className="text-[10px] text-surface-500 mt-0.5">{exp.company} • {exp.duration}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-450 italic">No employment history listed.</p>
                  )}
                </div>

                <div className="border-t border-surface-100 pt-3.5">
                  <h2 className="text-sm font-semibold font-display text-surface-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-500" strokeWidth={2} />
                    Featured Projects
                  </h2>
                  {projects.length > 0 ? (
                    <div className="space-y-2.5">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="bg-surface-50 border border-surface-150 p-2.5 rounded-xl space-y-1">
                          <h4 className="text-xs font-bold text-surface-850">{proj.name}</h4>
                          <p className="text-[10px] text-surface-500">{proj.desc}</p>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-[9px] text-brand-650 font-mono hover:underline truncate block">
                              {proj.link}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-450 italic">No projects listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Decision Center Sign-Off */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-brand-600" strokeWidth={2} />
                <div>
                  <h2 className="text-base font-bold font-display text-surface-900">
                    Recruiter Decision Center
                  </h2>
                  <p className="text-[10px] text-surface-450 mt-0.5">
                    Conclude applicant evaluation by signing off on the official verdict
                  </p>
                </div>
              </div>

              {!isEditingDecision && (
                <button
                  type="button"
                  onClick={() => setIsEditingDecision(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Edit Decision
                </button>
              )}
            </div>

            {isEditingDecision ? (
              <div className="space-y-4">
                {/* Radio Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Shortlisted', label: 'Shortlist / Hire', color: 'border-emerald-250 hover:border-emerald-400 bg-emerald-50/20 text-emerald-800', activeColor: 'ring-2 ring-emerald-500 border-emerald-500' },
                    { id: 'Hold', label: 'Put on Hold', color: 'border-amber-250 hover:border-amber-400 bg-amber-50/20 text-amber-800', activeColor: 'ring-2 ring-amber-500 border-amber-500' },
                    { id: 'Rejected', label: 'Reject Applicant', color: 'border-red-250 hover:border-red-400 bg-red-50/20 text-red-800', activeColor: 'ring-2 ring-red-500 border-red-500' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVerdict(opt.id)}
                      className={`border rounded-xl p-3 text-center transition-all ${opt.color} ${
                        verdict === opt.id ? opt.activeColor : 'opacity-70'
                      }`}
                    >
                      <span className="text-xs font-bold block">{opt.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">Decision Justification Rationale</label>
                  <textarea
                    rows="3"
                    value={verdictReason}
                    onChange={(e) => setVerdictReason(e.target.value)}
                    placeholder="Enter short decision justification comments, hiring panel consensus, next steps..."
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-xs text-surface-750 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveVerdict}
                    disabled={savingVerdict}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-5 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingVerdict ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Confirm & Sign-Off Verdict
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-surface-150 p-4 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider block">Official Verdict:</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    candidate.recruiter_verdict === 'Shortlisted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                      : candidate.recruiter_verdict === 'Hold'
                      ? 'bg-amber-50 text-amber-700 border border-amber-250'
                      : 'bg-red-50 text-red-700 border border-red-250'
                  }`}>
                    {candidate.recruiter_verdict}
                  </span>
                </div>
                {candidate.recruiter_verdict_reason && (
                  <div className="text-xs text-surface-650 leading-relaxed pl-3.5 border-l border-surface-250 italic">
                    "{candidate.recruiter_verdict_reason}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recruiter Notes & Comments Card */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4.5 h-4.5 text-brand-600" />
              <div>
                <h2 className="text-base font-semibold font-display text-surface-900">
                  Recruiter Feedback & Internal Comments
                </h2>
                <p className="text-[10px] text-surface-450 mt-0.5">
                  Internal feedback and evaluations visible only to the recruitment team
                </p>
              </div>
            </div>

            <textarea
              rows="4"
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              placeholder="Enter internal evaluation comments, hiring concerns, cultural fit notes..."
              className="w-full px-4 py-3 rounded-xl border border-surface-200 text-xs text-surface-750 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingNotes ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Comments
              </button>
            </div>
          </div>

          {/* AI Screening Summary */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150">
            <h2 className="text-base font-semibold font-display text-surface-900 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-500" strokeWidth={2} />
              AI Screening Summary
            </h2>
            {candidate.notes ? (
              <div className="bg-gradient-to-br from-surface-50 to-brand-50/30 rounded-xl p-5 border border-surface-100">
                <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">
                  {candidate.notes}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-sm text-surface-400 font-medium">
                  No AI screening notes available for this candidate
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'RESUME' && renderResumeTab()}

      {activeTab === 'EVALUATION' && renderEvaluationTab()}

      {/* Floating success toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold max-w-sm w-full sm:w-auto ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250 shadow-emerald-500/5'
                : 'bg-red-50 text-red-800 border-red-250 shadow-red-500/5'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Micro-score badges */
const ScoreBadge = ({ label, value }) => {
  const getBadgeColor = (val) => {
    if (val >= 8) return 'bg-emerald-50 text-emerald-700 border-emerald-250'
    if (val >= 5) return 'bg-brand-50 text-brand-700 border-brand-200'
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${getBadgeColor(value)}`}>
      {label}: {value || 0}
    </span>
  )
}

/** Speech synthesis sound wave equalizer indicator */
const SpeechWaveBouncing = ({ active }) => {
  if (active) {
    return (
      <span className="flex items-center gap-0.5 h-3.5 px-0.5">
        <span className="w-[2px] bg-brand-500 animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
        <span className="w-[2px] bg-brand-500 animate-bounce h-3" style={{ animationDelay: '0.2s' }} />
        <span className="w-[2px] bg-brand-500 animate-bounce h-1.5" style={{ animationDelay: '0.3s' }} />
      </span>
    )
  }
  return <Volume2 className="w-3.5 h-3.5" />
}

/** Information row helper */
const InfoRow = ({ icon: Icon, label, value, href }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-surface-50 flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-surface-400" strokeWidth={1.8} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-surface-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-medium text-surface-800 break-all">{value || '—'}</p>
      )}
    </div>
  </div>
)

export default CandidateDetailsPage
