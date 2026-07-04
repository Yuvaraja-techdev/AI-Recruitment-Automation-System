import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  ArrowLeft,
  Briefcase,
  Sparkles,
  Mic,
  Award,
  Clock,
  XCircle,
  CheckCircle,
  Inbox,
  Check,
} from 'lucide-react'
import {
  getCandidateById,
  getMyApplications,
  getInterviewSlots
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function NotificationsPage() {
  const navigate = useNavigate()
  
  // Dynamic list state
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'unread' | 'candidacy' | 'interview' | 'evaluation'
  
  // Read/unread states persistent in localStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notifications')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Sync read state back to localStorage
  useEffect(() => {
    localStorage.setItem('read_notifications', JSON.stringify(readIds))
  }, [readIds])

  useEffect(() => {
    const fetchAndGenerateNotifications = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!user.candidate_id) {
          setError('Recruiter and Admin accounts do not require notifications workspaces.')
          setLoading(false)
          return
        }

        const candidateId = user.candidate_id
        
        // Fetch DB states
        const candidate = await getCandidateById(candidateId)
        const apps = await getMyApplications()
        const slots = await getInterviewSlots()

        // Generate dynamic records list
        const list = []
        let logIndex = 1

        // 1. Applications logs
        apps.forEach((app) => {
          // Submitted Log
          list.push({
            id: `notif-app-sub-${app.id}`,
            title: 'Application Submitted',
            desc: `Your application for the ${app.job_title || 'Software role'} position at ${app.job_company || 'HireFlow Labs'} has been successfully received.`,
            category: 'candidacy',
            time: app.applied_at,
            link: '/applications',
            linkLabel: 'Track Application'
          })

          // Screening Log
          if (candidate.status !== 'PENDING') {
            list.push({
              id: `notif-app-screen-${app.id}`,
              title: 'Resume Screening Complete',
              desc: `AI evaluation for ${app.job_title} is finished. Target compatibility matching score is logged at ${candidate.ats_score || 80}%.`,
              category: 'evaluation',
              time: app.applied_at,
              link: `/applications/${app.id}`,
              linkLabel: 'View Match Report'
            })
          }

          // Voice Interview invitation
          if (['SCREENED', 'INTERVIEWING'].includes(candidate.status)) {
            list.push({
              id: `notif-app-invite-${app.id}`,
              title: 'AI Voice Interview Invitation',
              desc: 'Resume parameters match role requirements! Please verify audio hardware and begin your automated voice session.',
              category: 'interview',
              time: null,
              link: `/interview/${candidateId}`,
              linkLabel: 'Enter Interview Room',
              isUrgent: true
            })
          }

          // Outcome Offer
          if (candidate.status === 'SELECTED') {
            list.push({
              id: `notif-app-offer-${app.id}`,
              title: 'Hiring Offer Extended!',
              desc: `Recruiters have approved your interview performance and extended a hiring offer for the ${app.job_title} role.`,
              category: 'candidacy',
              time: null,
              link: `/applications/${app.id}`,
              linkLabel: 'Review Details',
              isSuccess: true
            })
          }

          // Outcome Rejection
          if (candidate.status === 'REJECTED') {
            list.push({
              id: `notif-app-reject-${app.id}`,
              title: 'Application Concluded',
              desc: `Thank you for participating in our screening stages for the ${app.job_title} position. This application folder is now closed.`,
              category: 'candidacy',
              time: null,
              link: `/applications/${app.id}`,
              linkLabel: 'View Timeline'
            })
          }
        })

        // 2. Interview Completed log
        if (candidate.overall_score !== null && candidate.overall_score !== undefined) {
          list.push({
            id: `notif-interview-complete`,
            title: 'Technical Voice Interview Graded',
            desc: `Your AI Technical Voice evaluation is complete. Cumulative evaluation score logged at ${candidate.overall_score}/10.`,
            category: 'evaluation',
            time: null,
            link: '/applications',
            linkLabel: 'Review Tracker'
          })
        }

        // 3. Scheduler logs & Reminders
        const userSlot = slots.find((s) => s.booked_by_candidate_id === candidateId)
        if (userSlot) {
          list.push({
            id: `notif-slot-book`,
            title: 'Interview Slot Booked',
            desc: `Your automated evaluation session is scheduled for ${userSlot.slot_time}.`,
            category: 'interview',
            time: null,
            link: '/scheduler',
            linkLabel: 'Manage Booking'
          })

          // Interview Reminder
          list.push({
            id: `notif-slot-reminder`,
            title: 'Interview Reminder',
            desc: `Reminder: Your technical evaluation call is scheduled to occur at ${userSlot.slot_time}. Please ensure stable internet and mic access.`,
            category: 'interview',
            time: null,
            link: `/interview/${candidateId}`,
            linkLabel: 'Join Interview Room',
            isUrgent: true
          })
        }

        // Remove duplicate notifications (by ID) just in case
        const uniqueList = list.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        setNotifications(uniqueList)
      } catch (err) {
        setError('Failed to load notifications center.')
      } finally {
        setLoading(false)
      }
    }

    fetchAndGenerateNotifications()
  }, [navigate])

  const formatDate = (isoString) => {
    if (!isoString) return 'Just Now'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoString
    }
  }

  const markAsRead = (id) => {
    if (readIds.includes(id)) return
    setReadIds((prev) => [...prev, id])
  }

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
  }

  const filteredNotifications = notifications.filter((notif) => {
    const isRead = readIds.includes(notif.id)
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return !isRead
    return notif.category === activeFilter
  })

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header bar navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/applications" className="text-xs font-bold text-slate-550 hover:underline">
              My Applications
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-650" />
              Notifications Center
              {unreadCount > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review activity logs and action requests regarding your candidacy progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-bold text-brand-650 hover:text-brand-850 hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all as read
              </button>
            )}

            {/* Filter pills */}
            {!loading && (
              <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-150 p-1 rounded-xl w-fit">
                {['all', 'unread', 'candidacy', 'interview', 'evaluation'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wide ${
                      activeFilter === filter
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-450 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}
          </div>
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

            {filteredNotifications.length === 0 ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <Inbox className="w-12 h-12 text-slate-350 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">All caught up!</h3>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto leading-normal">
                    You do not have any notifications in this folder. Apply for a position or book a slot to trigger workflow logs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notif) => {
                  const isUrgent = notif.isUrgent
                  const isSuccess = notif.isSuccess
                  const isRead = readIds.includes(notif.id)

                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all relative ${
                        isRead ? 'opacity-70 border-slate-150' : 'border-l-4 border-l-brand-600 shadow-sm border-slate-200'
                      } ${
                        isUrgent && !isRead
                          ? 'bg-brand-50/10 border-brand-200'
                          : isSuccess && !isRead
                          ? 'bg-emerald-50/10 border-emerald-200'
                          : 'hover:border-slate-350 hover:shadow-card'
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!isRead && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-600" />
                      )}

                      <div className="flex items-start gap-4">
                        {/* Visual category icon */}
                        <div className="mt-1 flex-shrink-0">
                          {notif.category === 'interview' ? (
                            <div className={`p-2.5 rounded-xl ${isUrgent ? 'bg-brand-100 text-brand-700' : 'bg-indigo-50 text-indigo-600'}`}>
                              <Mic className="w-4.5 h-4.5" />
                            </div>
                          ) : notif.category === 'evaluation' ? (
                            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                              <Sparkles className="w-4.5 h-4.5" />
                            </div>
                          ) : (
                            <div className={`p-2.5 rounded-xl ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                              {isSuccess ? <Award className="w-4.5 h-4.5" /> : <Briefcase className="w-4.5 h-4.5" />}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight font-display">
                              {notif.title}
                            </h4>
                            {isUrgent && (
                              <span className="bg-red-50 text-red-700 border border-red-150 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                                Action Needed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-550 leading-relaxed max-w-2xl">
                            {notif.desc}
                          </p>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {formatDate(notif.time)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          to={notif.link}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm block text-center ${
                            isUrgent
                              ? 'bg-brand-600 hover:bg-brand-700 text-white'
                              : isSuccess
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50'
                          }`}
                        >
                          {notif.linkLabel}
                        </Link>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
      
    </div>
  )
}

export default NotificationsPage
