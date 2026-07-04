import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  Play,
  Lock,
  AlertCircle,
  ArrowRight,
  Shield,
  Volume2,
  Camera,
  CheckCircle2,
} from 'lucide-react'
import { getCandidateById } from '../services/api'

const InterviewPortal = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // State
  const [candidateIdInput, setCandidateIdInput] = useState('')
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCandidateDetails = useCallback(async (candidateId) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCandidateById(candidateId)
      setCandidate(data)
    } catch (err) {
      console.error(err)
      setError('Interview access code not found. Please verify your link or code and try again.')
      setCandidate(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // If ID is in URL parameters, fetch automatically
  useEffect(() => {
    if (id) {
      fetchCandidateDetails(id)
    }
  }, [id, fetchCandidateDetails])

  const handleAccessSubmit = (e) => {
    e.preventDefault()
    if (!candidateIdInput.trim()) {
      setError('Please enter a valid Interview Access Code.')
      return
    }
    navigate(`/interview/${candidateIdInput.trim()}`)
  };

  const handleStartInterview = () => {
    const status = candidate?.status || 'PENDING'
    if (!['SCREENED', 'INTERVIEWING'].includes(status)) {
      if (status === 'PENDING') {
        alert("Your application is currently undergoing resume screening. You will be eligible to start this interview once screening is completed.")
      } else {
        alert("This interview session has already concluded and is closed.")
      }
      return
    }
    // Navigate to system check page (Module 2 route)
    navigate(`/interview/${candidate.candidate_id}/system-check`)
  };

  // ──────────────────────────────────────────────
  // RENDER: Enter Access ID screen
  // ──────────────────────────────────────────────
  if (!candidate && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-card border border-surface-150 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-indigo-600" />
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
              <Lock className="h-6 w-6" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold font-display text-surface-900 tracking-tight">
              AI Interview Portal
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Please enter your secure Interview Access Code to join your scheduled assessment.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleAccessSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-650 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="access-code" className="sr-only">
                  Interview Access Code
                </label>
                <input
                  id="access-code"
                  name="access-code"
                  type="text"
                  required
                  value={candidateIdInput}
                  onChange={(e) => setCandidateIdInput(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-surface-300 placeholder-surface-400 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 focus:z-10 sm:text-sm font-medium transition-all"
                  placeholder="e.g. CAND_001"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-sm shadow-brand-600/15 active:scale-[0.98] transition-all"
              >
                Join Assessment
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  // ──────────────────────────────────────────────
  // RENDER: Loading Spinner
  // ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-surface-500">Securing interview session...</p>
      </div>
    )
  }

  // ──────────────────────────────────────────────
  // RENDER: Welcome Screen with Instructions
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-card border border-surface-150 overflow-hidden"
      >
        <div className="h-2 bg-gradient-to-r from-brand-500 to-indigo-600" />
        
        <div className="p-8 sm:p-10 space-y-8">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-surface-100">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 mb-2 border border-brand-100">
                AI Voice Interview
              </span>
              <h1 className="text-2xl font-bold font-display text-surface-900 tracking-tight">
                Welcome, {candidate?.name}
              </h1>
              <p className="text-sm text-surface-500 mt-1">
                You have been invited to interview for: <span className="font-semibold text-surface-700">{candidate?.applied_role}</span>
              </p>
            </div>
            
            {/* Quick stats */}
            <div className="flex items-center gap-3 bg-surface-50 border border-surface-100 px-4 py-2.5 rounded-xl self-start sm:self-center">
              <Clock className="w-4.5 h-4.5 text-brand-600" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Duration</p>
                <p className="text-xs font-bold text-surface-800">15 mins (5 Qs)</p>
              </div>
            </div>
          </div>

          {/* Candidacy Status Warnings */}
          {candidate?.status === 'PENDING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 animate-scale-up">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold">Screening In Progress</h4>
                <p className="text-[11px] leading-normal">
                  Your profile resume is currently undergoing AI evaluation. You will be eligible to start this interview once recruiters approve your screening status.
                </p>
              </div>
            </div>
          )}

          {['SELECTED', 'REJECTED'].includes(candidate?.status) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-slate-500 animate-scale-up">
              <Lock className="w-5 h-5 text-slate-450 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold">Session Closed</h4>
                <p className="text-[11px] leading-normal">
                  Your evaluation has already been completed and concluded by our recruiters. This interview room is now closed.
                </p>
              </div>
            </div>
          )}

          {/* Instructions section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-brand-500" strokeWidth={2.2} />
              Important Guidelines
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InstructionCard
                icon={Volume2}
                title="Quiet Environment"
                description="Find a clean, noise-free room. Extraneous background noises might interfere with voice recognition."
              />
              <InstructionCard
                icon={Camera}
                title="Permissions"
                description="The next step verifies your webcam and microphone accesses. Ensure hardware is plugged in."
              />
              <InstructionCard
                icon={CheckCircle2}
                title="Speak Clearly"
                description="Speak at a normal volume, pacing your answers. You will have a live transcript box during the test."
              />
              <InstructionCard
                icon={AlertCircle}
                title="Stay in Window"
                description="Do not refresh, close, or navigate away from the browser window once the session is initialized."
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <Lock className="w-3.5 h-3.5" />
              Your response is encrypted and private.
            </div>
            <button
              onClick={handleStartInterview}
              disabled={!['SCREENED', 'INTERVIEWING'].includes(candidate?.status)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/10 active:scale-[0.98] transition-all hover:shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              Start System Check
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Reusable card for instructions
const InstructionCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-50 border border-surface-100 hover:shadow-sm transition-all">
    <div className="p-2 rounded-lg bg-white shadow-sm flex-shrink-0 mt-0.5 border border-surface-100">
      <Icon className="w-4 h-4 text-brand-600" />
    </div>
    <div className="space-y-0.5">
      <h4 className="text-xs font-bold text-surface-850">{title}</h4>
      <p className="text-xs text-surface-500 leading-relaxed">{description}</p>
    </div>
  </div>
)

export default InterviewPortal
