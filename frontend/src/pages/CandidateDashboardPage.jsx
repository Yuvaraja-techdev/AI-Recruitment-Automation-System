import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Briefcase,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Mic,
  Settings,
  LogOut,
  Award,
  CheckCircle,
  Bell,
  Cpu,
  AlertCircle,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  getCandidateById,
  getMyApplications,
  getInterviewSlots,
  getSavedJobs,
  getJobRecommendations
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function CandidateDashboardPage() {
  const navigate = useNavigate()
  
  // Dashboard details
  const [candidate, setCandidate] = useState(null)
  const [appsCount, setAppsCount] = useState(0)
  const [interviewTime, setInterviewTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [savedCount, setSavedCount] = useState(0)
  const [interviewsCount, setInterviewsCount] = useState(0)
  const [recentApps, setRecentApps] = useState([])
  const [dashboardRecs, setDashboardRecs] = useState([])

  // Notifications and activities
  const [notifications, setNotifications] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    const loadDashboardData = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!user.candidate_id) {
          setError('Recruiter and Admin accounts do not use Candidate Dashboard workspaces.')
          setLoading(false)
          return
        }

        // Fetch Candidate Profile
        const candidateProfile = await getCandidateById(user.candidate_id)
        setCandidate(candidateProfile)

        // Fetch Applications Count & Recent list
        const apps = await getMyApplications()
        setAppsCount(apps.length)
        setRecentApps(apps.slice(0, 3))

        // Fetch Saved Jobs
        const saved = await getSavedJobs()
        setSavedCount(saved.length)

        // Fetch Recommendations
        const recs = await getJobRecommendations()
        setDashboardRecs(recs.slice(0, 3))

        // Fetch Booked Interview Slot
        let slotTimeStr = ''
        const slots = await getInterviewSlots()
        const mySlots = slots.filter((s) => s.booked_by_candidate_id === user.candidate_id)
        setInterviewsCount(mySlots.length)
        
        const activeSlot = mySlots[0]
        if (activeSlot) {
          slotTimeStr = activeSlot.slot_time
          setInterviewTime(slotTimeStr)
        }

        // Build notifications and activities dynamically based on candidate status & applications
        const notifs = []
        const acts = []

        if (apps.length > 0) {
          notifs.push({
            id: '1',
            title: 'Application Submitted',
            desc: `Submitted application for ${candidateProfile.applied_role || 'Developer position'}.`,
            time: 'Just now',
            type: 'submission'
          })
          acts.push({
            id: 'act1',
            title: 'Application Received',
            desc: `Successfully applied to ${candidateProfile.applied_role || 'Developer position'}.`,
            time: 'Just now'
          })
        }

        if (candidateProfile.status !== 'PENDING') {
          notifs.push({
            id: '2',
            title: 'Screening Completed',
            desc: `ATS Score evaluated: ${candidateProfile.ats_score || 80}%. Profile is screening qualified.`,
            time: '1h ago',
            type: 'screening'
          })
          acts.push({
            id: 'act2',
            title: 'AI Resume Screened',
            desc: `Calculated suitability compatibility score of ${candidateProfile.ats_score || 80}%.`,
            time: '1h ago'
          })
        }

        if (slotTimeStr) {
          notifs.push({
            id: '3',
            title: 'Interview Scheduled',
            desc: `Interview room reservation confirmed for ${slotTimeStr}.`,
            time: '3h ago',
            type: 'schedule'
          })
          acts.push({
            id: 'act3',
            title: 'Interview Appointment Confirmed',
            desc: `Selected time slot: ${slotTimeStr}.`,
            time: '3h ago'
          })
        }

        if (candidateProfile.overall_score) {
          notifs.push({
            id: '4',
            title: 'Evaluation Completed',
            desc: `AI Voice interview finished with score rating: ${candidateProfile.overall_score}/10.`,
            time: '5h ago',
            type: 'interview'
          })
          acts.push({
            id: 'act4',
            title: 'Voice Assessment Finished',
            desc: `Concluded automated technical questions assessment.`,
            time: '5h ago'
          })
        }

        if (candidateProfile.status === 'SELECTED') {
          notifs.push({
            id: '5',
            title: 'Offer Extended',
            desc: `Congratulations! Recruiter panel selected you and generated offer letter.`,
            time: 'Yesterday',
            type: 'offer'
          })
          acts.push({
            id: 'act5',
            title: 'Hiring Offer Extended',
            desc: `Hiring consensus reached. Offer dispatched to candidate.`,
            time: 'Yesterday'
          })
        }

        setNotifications(notifs)
        setActivities(acts)

      } catch (err) {
        setError('Failed to fetch dashboard resources.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return <LoadingSkeleton type="dashboard" />
  }

  const getProfileCompletion = (c) => {
    if (!c) return 0
    let pct = 0
    if (c.resume) pct += 20
    if (c.skills && c.skills.length > 0) pct += 15
    if (c.education && c.education.length > 0) pct += 15
    if (c.experience && c.experience.length > 0) pct += 15
    if (c.phone_number && c.phone_number.trim()) pct += 15
    if (c.preferred_roles && c.preferred_roles.length > 0) pct += 10
    if (c.profile_photo && c.profile_photo.trim()) pct += 10
    return pct
  }

  const completionRate = getProfileCompletion(candidate)
  const score = candidate?.ats_score || 0
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header NavBar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/25">
              H
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">HireFlow AI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-650 text-white font-extrabold text-[8px] flex items-center justify-center border border-white">
                  {notifications.length}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        {/* Welcome Section Banner */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl opacity-50" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
              Candidate Workspace
            </span>
            <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display mt-2">
              Welcome Back, {candidate?.name || 'Developer'}
            </h1>
            <p className="text-xs text-slate-500">
              Manage credentials, verify ATS compatibilities, monitor applications, and start AI evaluations.
            </p>
          </div>
          
          {candidate?.applied_role && (
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center gap-3 z-10">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Application</p>
                <p className="text-xs font-bold text-slate-800">{candidate.applied_role}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard split grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Summary metrics & Dynamic Activity */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Status cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Profile Completion Card */}
              <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Profile Completion</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-brand-600 font-display">{completionRate}%</span>
                  <span className="text-[10px] text-slate-450 font-bold">complete</span>
                </div>
                <div className="h-1.5 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${completionRate}%` }} />
                </div>
              </div>

              {/* Saved Positions Card */}
              <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Saved Roles</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800 font-display">{savedCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">bookmarked</span>
                </div>
                <div className="h-1.5 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(savedCount * 20, 100)}%` }} />
                </div>
              </div>

              {/* Submitted Applications Card */}
              <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-3">
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Applications Submitted</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800 font-display">{appsCount}</span>
                  <span className="text-[10px] text-slate-450 font-semibold">total</span>
                </div>
                <div className="h-1.5 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(appsCount * 25, 100)}%` }} />
                </div>
              </div>

              {/* Interviews Booked Card */}
              <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">AI Interviews</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-800 font-display">{interviewsCount}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">scheduled</span>
                </div>
                <div className="h-1.5 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(interviewsCount * 50, 100)}%` }} />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ATS Compatibility gauge */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Resume Evaluation compatibility</span>
                  <h4 className="text-sm font-extrabold text-surface-900 tracking-tight font-display">ATS Screening Profile</h4>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-bold uppercase ${
                    score >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-brand-50 text-brand-700 border border-brand-100'
                  }`}>
                    {score >= 85 ? 'Strong Match' : 'Normal Standing'}
                  </span>
                </div>

                <div className="relative w-18 h-18 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="36" cy="36" r="30" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="36"
                      cy="36"
                      r="30"
                      className="stroke-brand-600 transition-all duration-500"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 30}
                      strokeDashoffset={2 * Math.PI * 30 - (score / 100) * (2 * Math.PI * 30)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-sm font-black text-slate-900 font-mono">{score}%</span>
                </div>
              </div>

              {/* Upcoming interview card */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3">
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Upcoming Interview Appointment</span>
                
                {interviewTime ? (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate" title={interviewTime}>{interviewTime}</p>
                      <span className="text-[9px] font-bold text-emerald-750 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded inline-block">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/interview/${candidate.candidate_id}/system-check`}
                        className="text-center bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-1.5 rounded-xl text-[10px] transition-all"
                      >
                        Test
                      </Link>
                      <Link
                        to={`/interview/${candidate.candidate_id}`}
                        className="text-center bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] transition-all uppercase tracking-wider"
                      >
                        Join
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400 italic">No slot scheduled yet</p>
                      <p className="text-[9px] text-slate-450">Select slot to begin technical evaluation.</p>
                    </div>
                    <Link
                      to="/scheduler"
                      className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl transition-all"
                    >
                      Book Slot
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-brand-600" />
                  <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider font-display">Recent Submissions</h3>
                </div>
                <Link to="/applications" className="text-xs font-bold text-brand-650 hover:underline">View All</Link>
              </div>

              {recentApps.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-150 rounded-2xl">
                  <p className="text-xs text-slate-450 italic">No applications submitted yet.</p>
                  <Link to="/jobs" className="text-xs text-brand-600 font-bold hover:underline mt-2 inline-block">Browse jobs board &rarr;</Link>
                </div>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 text-xs">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-150 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-5">Position</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2">ATS Score</div>
                    <div className="col-span-2 text-right">Details</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {recentApps.map((app) => (
                      <div key={app.id} className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="col-span-5">
                          <span className="font-semibold text-slate-700 block truncate">{app.job_title || 'Software Engineer'}</span>
                          <span className="text-[10px] text-slate-440 font-semibold block">{app.company || 'Tech Corp'}</span>
                        </div>
                        <div className="col-span-3">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            app.status === 'SELECTED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : app.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {app.status || 'PENDING'}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold text-slate-600 font-mono">{app.ats_score || 'N/A'}%</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <Link to={`/applications`} className="text-[10px] font-extrabold text-brand-650 hover:underline">
                            Track
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendations panel */}
            {dashboardRecs.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm space-y-4 border border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider font-display">AI Recommended Career Matches</h3>
                  </div>
                  <Link to="/jobs" className="text-[10px] font-bold text-indigo-300 hover:underline uppercase tracking-wide">Explore Jobs</Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardRecs.map(({ job, reason, match_pct }) => {
                    const initials = (job.company || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    return (
                      <div key={job.id} className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs text-left">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-indigo-500/25 flex items-center justify-center font-bold text-[10px] text-indigo-300">
                              {initials}
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-white truncate text-[11px]">{job.title}</h4>
                              <p className="text-[9px] text-slate-400 font-semibold">{job.company}</p>
                            </div>
                          </div>
                          <div className="text-[9px] text-indigo-200/80 italic leading-relaxed bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/10">
                            {reason}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px]">
                          <span className="text-emerald-400 font-extrabold">{match_pct}% Match</span>
                          <button
                            type="button"
                            onClick={() => navigate('/jobs')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-2.5 py-1 rounded transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity Timeline Log */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-brand-655" />
                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                  Recent Activity Log
                </h3>
              </div>

              {activities.length > 0 ? (
                <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-slate-200">
                  {activities.map((act, index) => (
                    <div key={index} className="relative flex gap-3.5 items-start text-xs">
                      <div className="absolute -left-[22.5px] top-1 w-[8px] h-[8px] rounded-full bg-brand-500 border border-white" />
                      <div className="space-y-0.5 flex-1">
                        <span className="font-bold text-slate-850 block">{act.title}</span>
                        <p className="text-[10px] text-slate-450 leading-relaxed">{act.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-450 italic">No recent dashboard activities logged</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Workspace Shortcuts & Notifications center widget */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Shortcuts
              </h3>
              
              <div className="space-y-3">
                <ShortcutRow to="/profile" icon={User} title="My Profile" />
                <ShortcutRow to="/jobs" icon={Briefcase} title="Search Jobs" />
                <ShortcutRow to="/resume" icon={FileText} title="Resume Manager" />
                <ShortcutRow to="/scheduler" icon={Calendar} title="Interview Scheduler" />
                <ShortcutRow to="/applications" icon={Layers} title="Application Tracker" />
                <ShortcutRow to="/activity" icon={Activity} title="Activity Log History" />
                <ShortcutRow to="/insights" icon={TrendingUp} title="AI Match & Insights" />
              </div>
            </div>

            {/* Notifications widget */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                  Alert Notifications Center
                </h3>
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {notifications.length} alerts
                </span>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-250 transition-all text-xs space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800">{notif.title}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{notif.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{notif.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-400 font-medium">All caught up! No active notifications.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

    </div>
  )
}

// Reusable Shortcut Row Component
const ShortcutRow = ({ to, icon: Icon, title }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl transition-all text-xs font-bold text-slate-700 shadow-sm"
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400" />
      <span>{title}</span>
    </div>
    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
  </Link>
)

export default CandidateDashboardPage
