import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  XCircle,
  RefreshCw,
  Info
} from 'lucide-react'
import {
  getInterviewSlots,
  bookInterviewSlot,
  cancelInterviewSlot,
  getCandidateById
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function InterviewSchedulerPage() {
  const navigate = useNavigate()
  const [candidateId, setCandidateId] = useState('')
  const [candidateDetails, setCandidateDetails] = useState(null)
  
  // Slots states
  const [slots, setSlots] = useState([])
  const [bookedSlot, setBookedSlot] = useState(null)

  // Alerts & loaders
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSchedulerData = async () => {
    const userString = localStorage.getItem('user')
    if (!userString) {
      navigate('/login')
      return
    }

    try {
      const user = JSON.parse(userString)
      if (!user.candidate_id) {
        setError('Recruiter and Admin accounts do not require interview scheduling.')
        setLoading(false)
        return
      }

      setCandidateId(user.candidate_id)
      
      // Fetch Candidate details
      const candData = await getCandidateById(user.candidate_id)
      setCandidateDetails(candData)
      
      // Fetch available slots
      const slotsList = await getInterviewSlots()
      setSlots(slotsList)

      // Detect if user holds a booked slot
      const userBooked = slotsList.find((s) => s.booked_by_candidate_id === user.candidate_id)
      setBookedSlot(userBooked || null)
    } catch (err) {
      setError('Failed to fetch interview scheduling resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedulerData()
  }, [navigate])

  const handleBookSlot = async (slotId) => {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedSlot = await bookInterviewSlot(slotId)
      setSuccess(`Successfully booked slot: ${updatedSlot.slot_time}`)
      
      // Re-fetch all slots to sync statuses
      const freshSlots = await getInterviewSlots()
      setSlots(freshSlots)
      
      const freshBooked = freshSlots.find((s) => s.booked_by_candidate_id === candidateId)
      setBookedSlot(freshBooked || null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book slot.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel your scheduled interview slot?')) {
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await cancelInterviewSlot()
      setSuccess('Successfully cancelled your interview booking.')
      
      const freshSlots = await getInterviewSlots()
      setSlots(freshSlots)
      setBookedSlot(null)
    } catch (err) {
      setError('Failed to release slot reservation.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-xs font-bold text-slate-550 hover:underline">
              My Profile
            </Link>
            <Link to="/applications" className="text-xs font-bold text-slate-550 hover:underline">
              My Applications
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        <div>
          <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display">
            Interview Slot Scheduler
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Book or manage your upcoming technical voice interview slot.
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton type="card" />
        ) : (
          <>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-emerald-800 animate-scale-up">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Active Booking Card */}
        {bookedSlot ? (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Calendar className="w-10 h-10 text-emerald-500 flex-shrink-0 mt-1 animate-pulse" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Booking Confirmed
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  {bookedSlot.slot_time}
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed max-w-lg">
                  Your voice call interview with the AI agent has been reserved. You can enter the interview portal when this time arrives.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="bg-white border border-red-200 text-red-650 hover:bg-red-50 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <XCircle className="w-4.5 h-4.5" /> Cancel Reservation
            </button>
          </div>
        ) : candidateDetails && !['SCREENED', 'INTERVIEWING'].includes(candidateDetails.status?.toUpperCase()) ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 text-amber-800 animate-scale-up">
            <AlertCircle className="w-8 h-8 text-amber-500 mt-1 flex-shrink-0 animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">Awaiting Screening Review</h3>
              <p className="text-xs leading-relaxed max-w-xl">
                Your application is currently undergoing resume screening. You will be eligible to schedule your AI interview slot once recruiters approve your screening status.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 text-amber-800">
            <AlertCircle className="w-8 h-8 text-amber-500 mt-1 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider">Unscheduled Interview</h3>
              <p className="text-xs leading-relaxed max-w-xl">
                You do not have a scheduled slot for your technical evaluation. Review the available time blocks below and reserve a slot.
              </p>
            </div>
          </div>
        )}

        {/* Available slots list card grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Available Interview Times
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => {
              const isMine = slot.booked_by_candidate_id === candidateId
              const isOtherBooked = slot.is_booked && !isMine
              
              return (
                <div
                  key={slot.id}
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 ${
                    isMine
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
                      : isOtherBooked
                      ? 'border-slate-150 opacity-60'
                      : 'border-slate-150 hover:border-slate-350 hover:shadow-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${isMine ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-800">
                        {slot.slot_time}
                      </span>
                    </div>

                    <div>
                      {isMine ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold">
                          Reserved by You
                        </span>
                      ) : isOtherBooked ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 text-[9px] font-bold">
                          Unavailable
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    {isMine ? (
                      <button
                        type="button"
                        onClick={handleCancelBooking}
                        disabled={actionLoading}
                        className="text-red-500 hover:underline text-xs font-bold"
                      >
                        Cancel Booking
                      </button>
                    ) : isOtherBooked ? (
                      <span className="text-[11px] text-slate-400 font-semibold italic">
                        Reserved
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBookSlot(slot.id)}
                        disabled={actionLoading || !['SCREENED', 'INTERVIEWING'].includes(candidateDetails?.status?.toUpperCase())}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookedSlot ? 'Change to this time' : 'Select Slot'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Extra info footer */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex gap-3 text-slate-500">
          <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Evaluation sessions are conducted verbally in a voice room directly in your web browser. Ensure you have a functioning microphone and a quiet environment before entering your scheduled session.
          </p>
        </div>

          </>
        )}
      </main>

    </div>
  )
}

export default InterviewSchedulerPage
