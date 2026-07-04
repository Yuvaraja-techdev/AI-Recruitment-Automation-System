import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  FileText,
  Briefcase,
  Mic,
  Bell,
  CheckCircle,
  Activity,
  Calendar,
  Award,
  XCircle,
} from 'lucide-react'
import { getCandidateById, getMyApplications, getInterviewSlots } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function CandidateActivityPage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchActivities = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!user.candidate_id) {
          setError('Recruiter and Admin accounts do not require activities workspaces.')
          setLoading(false)
          return
        }

        const candidateId = user.candidate_id
        
        // Fetch data resources
        const candidate = await getCandidateById(candidateId)
        const apps = await getMyApplications()
        const slots = await getInterviewSlots()

        // Compile logs list
        const logs = []

        // 1. Resume Uploaded
        if (candidate.resume_filename) {
          logs.push({
            id: 'resume-upload',
            title: 'Resume Document Uploaded',
            desc: `Parsed file: "${candidate.resume_filename}". Matches profile qualifications.`,
            category: 'Resume',
            icon: FileText,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
            time: 'Account Setup'
          })
        }

        // 2. Applications
        apps.forEach((app) => {
          logs.push({
            id: `app-sub-${app.id}`,
            title: 'Job Application Submitted',
            desc: `Applied to ${app.job_title} at ${app.job_company}. Screening pipeline initiated.`,
            category: 'Application',
            icon: Briefcase,
            color: 'text-blue-600 bg-blue-50 border-blue-100',
            time: app.applied_at
          })
        })

        // 3. Status updates / Screening
        if (candidate.status !== 'PENDING') {
          logs.push({
            id: 'ats-screened',
            title: 'AI Screening Review Complete',
            desc: `Evaluated ATS suitability match: ${candidate.ats_score || 80}%. Profile moved to SCREENED.`,
            category: 'System',
            icon: CheckCircle,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
            time: 'Recently'
          })
        }

        // 4. Time slot booking
        const bookedSlot = slots.find(s => s.booked_by_candidate_id === candidateId)
        if (bookedSlot) {
          logs.push({
            id: 'slot-booked',
            title: 'Interview Appointment Scheduled',
            desc: `Booked technical call slot: ${bookedSlot.slot_time}.`,
            category: 'Scheduling',
            icon: Calendar,
            color: 'text-purple-600 bg-purple-50 border-purple-100',
            time: 'Recently'
          })
        }

        // 5. Evaluation / Interview attempts
        if (candidate.overall_score !== null && candidate.overall_score !== undefined) {
          logs.push({
            id: 'eval-complete',
            title: 'AI Voice Interview Attempt Complete',
            desc: `Concluded technical evaluation interview. Performance score: ${candidate.overall_score}/10.`,
            category: 'Evaluation',
            icon: Mic,
            color: 'text-pink-650 bg-pink-50 border-pink-100',
            time: 'Recently'
          })
        }

        // 6. Verdict outcomes
        if (candidate.status === 'SELECTED') {
          logs.push({
            id: 'verdict-offer',
            title: 'Official Selection Verdict Logged',
            desc: 'Offer Extended! The recruitment panel approved credentials and sent offer materials.',
            category: 'Verdict',
            icon: Award,
            color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
            time: 'Recently'
          })
        }

        // Sort logs (mock timeline ordering)
        setActivities(logs)
      } catch (err) {
        setError('Failed to fetch activity logs.')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [navigate])

  const formatDate = (isoString) => {
    if (!isoString) return ''
    if (isoString === 'Account Setup' || isoString === 'Recently') return isoString
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoString
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header bar navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xs font-bold text-slate-555 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400 font-medium">Activity Logs Workspace</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        <div>
          <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-650" />
            Candidacy Activity History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review detailed, chronological status milestones and updates logged during your application cycle.
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton type="details" />
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-800">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {activities.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
                <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 font-display">No logs found</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    Account is setup. Apply for positions or upload files to start logs tracking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card border border-surface-150 p-6 sm:p-8">
                
                <div className="relative pl-8 space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                  {activities.map((act) => {
                    const Icon = act.icon
                    return (
                      <div key={act.id} className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                        
                        {/* Timeline Icon Node */}
                        <div className={`absolute -left-[45px] top-0 w-8.5 h-8.5 rounded-xl border border-white shadow-sm flex items-center justify-center ${act.color} z-10`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                              {act.title}
                            </span>
                            <span className="bg-slate-100 text-slate-500 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                              {act.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-550 leading-relaxed max-w-xl">
                            {act.desc}
                          </p>
                        </div>

                        <div className="text-left sm:text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 sm:justify-end">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {formatDate(act.time)}
                          </span>
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

export default CandidateActivityPage
