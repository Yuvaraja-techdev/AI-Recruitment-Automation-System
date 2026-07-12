import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Mic,
  Award,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Cpu,
  Brain,
  BadgeCheck,
  FileText,
  IndianRupee,
  MapPin,
  ListChecks,
} from 'lucide-react'
import { getApplicationById, getCandidateById, getJobById, getInterviewSlots } from '../services/api'
import Breadcrumb from '../components/Breadcrumb'
import StatusBadge from '../components/StatusBadge'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'

function ApplicationDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [application, setApplication] = useState(null)
  const [candidate, setCandidate] = useState(null)
  const [job, setJob] = useState(null)
  const [interviewTime, setInterviewTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch Application
      const appData = await getApplicationById(id)
      setApplication(appData)

      // Fetch Candidate profile
      const candData = await getCandidateById(appData.candidate_id)
      setCandidate(candData)

      // Fetch Job
      const jobData = await getJobById(appData.job_id)
      setJob(jobData)

      // Fetch Interview Slot Booking
      const slots = await getInterviewSlots()
      const mySlot = slots.find((s) => s.booked_by_candidate_id === appData.candidate_id)
      if (mySlot) {
        setInterviewTime(mySlot.slot_time)
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load application details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  if (loading) return <LoadingSkeleton type="details" />
  if (error) return <ErrorState message={error} onRetry={fetchDetails} />
  if (!application || !candidate || !job) return <ErrorState message="Application not found" />

  const getCompanyInitials = (name) => {
    if (!name) return 'HF'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

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
  const missingSkills = safeArray(candidate.missing_skills)
  const strengths = safeArray(candidate.strengths)
  const weaknesses = safeArray(candidate.weaknesses)

  // Status mapping
  const isActiveJob = job.title === candidate.applied_role
  const currentStatus = isActiveJob ? candidate.status : application.status
  const statusNormalized = currentStatus?.toUpperCase()

  // Timeline Steps matching all 9 milestones dynamically
  const steps = [
    {
      title: 'Resume Uploaded',
      desc: candidate.resume_filename ? `File "${candidate.resume_filename}" parsed successfully.` : 'Resume uploaded & verified.',
      done: true,
    },
    {
      title: 'Application Submitted',
      desc: `Application received on ${formatDate(application.applied_at)}.`,
      done: true,
    },
    {
      title: 'AI Resume Screening',
      desc: ['SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].includes(statusNormalized)
        ? `ATS score calculated: ${candidate.ats_score || 80}%.`
        : 'Evaluating qualifications & skills requirements.',
      done: ['SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].includes(statusNormalized),
    },
    {
      title: 'Shortlisted',
      desc: ['SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].includes(statusNormalized) && (candidate.ats_score || 80) >= 80
        ? 'Qualifications match core expectations.'
        : 'Awaiting screening checklist review.',
      done: ['SCREENED', 'INTERVIEWING', 'SELECTED', 'REJECTED'].includes(statusNormalized) && (candidate.ats_score || 80) >= 80,
    },
    {
      title: 'Interview Slot Booked',
      desc: interviewTime ? `Scheduled slot: ${interviewTime}.` : 'Schedule an available slot in the scheduler.',
      done: !!interviewTime || ['SELECTED', 'REJECTED'].includes(statusNormalized),
    },
    {
      title: 'AI Interview',
      desc: candidate.overall_score
        ? `Assessment finished. Score: ${candidate.overall_score}/10.`
        : 'Interactive verbal call evaluation.',
      done: !!candidate.overall_score || ['SELECTED', 'REJECTED'].includes(statusNormalized),
    },
    {
      title: 'Recruiter Review',
      desc: ['SELECTED', 'REJECTED'].includes(statusNormalized)
        ? 'Hiring panel review completed.'
        : candidate.overall_score
        ? 'Reviewing interview transcripts & feedback.'
        : 'Awaiting assessment outcome.',
      done: ['SELECTED', 'REJECTED'].includes(statusNormalized),
    },
    {
      title: 'Offer',
      desc: statusNormalized === 'SELECTED'
        ? 'Selected! Official offer extended.'
        : statusNormalized === 'REJECTED'
        ? 'Process concluded.'
        : 'Hiring decision resolution.',
      done: statusNormalized === 'SELECTED',
    },
    {
      title: statusNormalized === 'REJECTED' ? 'Application Closed' : 'Selected / Rejected',
      desc: statusNormalized === 'SELECTED'
        ? 'Welcome to the team!'
        : statusNormalized === 'REJECTED'
        ? 'Thank you for participating. We will retain your files.'
        : 'Final selection pending.',
      done: ['SELECTED', 'REJECTED'].includes(statusNormalized),
    },
  ]

  const breadcrumbItems = [
    { label: 'Applications', path: '/applications' },
    { label: job.title || 'Application Details' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 pb-16 animate-fade-in font-sans">
      
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Info Panel */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-surface-150">
        <div
          className={`h-1.5 transition-all ${
            statusNormalized === 'SELECTED'
              ? 'bg-emerald-500'
              : statusNormalized === 'REJECTED'
              ? 'bg-red-500'
              : 'bg-brand-500'
          }`}
        />

        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-650 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-brand-500/10 flex-shrink-0">
              {getCompanyInitials(job.company)}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-surface-900 tracking-tight font-display">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-bold text-slate-700">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {job.location || 'Remote'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" /> {job.salary || 'Competitive'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
      </div>

      {/* Grid Layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Job details & AI Resume Match insights */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Job Description */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
                Role Description & Requirements
              </h2>
              <p className="text-[10px] text-surface-450 mt-0.5">
                Understand qualifications, required stack skills, and role dynamics
              </p>
            </div>

            <div className="text-xs text-surface-650 leading-relaxed whitespace-pre-wrap space-y-4">
              <p>{job.description}</p>
              {job.requirements && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-surface-950 block">Core Requirements:</span>
                  <p>{job.requirements}</p>
                </div>
              )}
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="pt-4 border-t border-surface-100 space-y-2">
                <span className="text-[10px] font-bold text-surface-450 uppercase block">Required Core Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Application Status Center Card */}
          {isActiveJob && (
            <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-650" />
                  Application Status Center
                </h2>
                <p className="text-[10px] text-surface-450 mt-0.5">
                  AI evaluation insights, credential analysis, and recruiter notes feedback
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* ATS Score & Match Rating */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ATS Compatibility</span>
                  <div className="text-lg font-black text-brand-600">{candidate.ats_score || 80}%</div>
                  <span className="text-[10px] font-medium text-slate-500 block">Verdict: {candidate.ai_recommendation || 'Recommended'}</span>
                </div>

                {/* Interview Status & Recommendation */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Interview Status</span>
                  <div>
                    {candidate.overall_score !== null && candidate.overall_score !== undefined ? (
                      <span className="inline-block text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        Finished ({candidate.overall_score}/10)
                      </span>
                    ) : interviewTime ? (
                      <span className="inline-block text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        Scheduled
                      </span>
                    ) : (
                      <span className="inline-block text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        Awaiting Schedule
                      </span>
                    )}
                  </div>
                  {candidate.interview_recommendation && (
                    <span className="text-[10px] font-medium text-slate-500 block">AI Rating: {candidate.interview_recommendation}</span>
                  )}
                </div>

                {/* Final Recruiter Verdict */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hiring Verdict</span>
                  <div>
                    {candidate.recruiter_verdict ? (
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        candidate.recruiter_verdict === 'Shortlisted'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                          : candidate.recruiter_verdict === 'Hold'
                          ? 'bg-amber-50 text-amber-700 border border-amber-250'
                          : 'bg-red-50 text-red-700 border border-red-250'
                      }`}>
                        {candidate.recruiter_verdict}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-450 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">Pending Verdict</span>
                    )}
                  </div>
                  {candidate.recruiter_verdict_reason && (
                    <p className="text-[9px] text-slate-500 italic truncate" title={candidate.recruiter_verdict_reason}>
                      "{candidate.recruiter_verdict_reason}"
                    </p>
                  )}
                </div>
              </div>

              {/* Recruiter Evaluation Notes & Feedback Comments if visible */}
              {candidate.recruiter_notes && (
                <div className="bg-brand-50/20 border border-brand-100 p-4 rounded-xl space-y-1 text-xs text-brand-850">
                  <span className="font-extrabold text-[9px] uppercase tracking-wider text-brand-700 block">Official Recruiter Notes</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{candidate.recruiter_notes}</p>
                </div>
              )}

              {/* Skills checklist comparisons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block tracking-wider">Matched Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {matchedSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block tracking-wider">Missing Requirements</span>
                  <div className="flex flex-wrap gap-1">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-650 border border-slate-200 text-[10px] font-semibold">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">None. Resume matches all listed skills.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Timeline steps, scheduler hooks, final outcome alerts */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Timeline tracker */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-5">
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-650" />
              Application Journey
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex gap-3.5 items-start text-xs">
                  <div className={`absolute -left-[23px] top-0.5 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center z-10 ${
                    step.done ? 'bg-brand-500 border-brand-500' : 'bg-white border-slate-350'
                  }`}>
                    {step.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                  </div>
                  <div>
                    <h5 className={`font-bold ${step.done ? 'text-slate-850' : 'text-slate-400'}`}>
                      {step.title}
                    </h5>
                    <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring outcome alert box */}
          {['SELECTED', 'REJECTED'].includes(statusNormalized) && (
            <div className={`rounded-2xl p-6 border shadow-sm space-y-3 ${
              statusNormalized === 'SELECTED' 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-red-50/30 border-red-150'
            }`}>
              <div className="flex items-center gap-2">
                {statusNormalized === 'SELECTED' ? (
                  <>
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 uppercase">Offer Extended!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold text-red-900 uppercase">Application Concluded</span>
                  </>
                )}
              </div>
              
              {candidate.recruiter_verdict_reason && (
                <div className="text-xs text-slate-650 leading-relaxed pl-3 border-l border-slate-300 italic">
                  "{candidate.recruiter_verdict_reason}"
                </div>
              )}
            </div>
          )}

          {/* Scheduler Hook Widget */}
          {isActiveJob && ['SCREENED', 'INTERVIEWING'].includes(statusNormalized) && (
            <div className="bg-white rounded-2xl shadow-card p-6 border border-surface-150 space-y-4">
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-brand-650 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-surface-900">AI Verbal Evaluation Room</h4>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    Connect and evaluate your technical skills interactively.
                  </p>
                </div>
              </div>

              {interviewTime ? (
                <div className="bg-brand-50/50 border border-brand-200 p-4 rounded-xl space-y-4 text-xs">
                  <div className="space-y-2">
                    <span className="font-extrabold text-brand-900 block uppercase tracking-wider text-[10px]">Assessment Appointment Confirmed</span>
                    
                    <div className="space-y-1 bg-white/60 p-3 rounded-lg border border-brand-100">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        <span className="font-bold">Date & Time:</span>
                        <span>{interviewTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link
                      to={`/interview/${candidate.candidate_id}/system-check`}
                      className="text-center bg-white border border-brand-200 hover:bg-brand-50 text-brand-750 font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      System Check
                    </Link>

                    <Link
                      to={`/interview/${candidate.candidate_id}`}
                      className="text-center bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 uppercase tracking-wider"
                    >
                      Join Room
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-3 text-xs">
                  <p className="text-amber-800 font-semibold leading-relaxed">
                    You passed resume screening filters! Please select an interview slot date to activate the room.
                  </p>
                  <Link
                    to="/scheduler"
                    className="w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all inline-block"
                  >
                    Book Appointment Slot
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default ApplicationDetailsPage
