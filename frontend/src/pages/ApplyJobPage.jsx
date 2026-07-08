import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeft, 
  BriefcaseBusiness, 
  FileText, 
  Upload, 
  AlertCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Hourglass,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import axios from 'axios'
import { getJobById, getCandidateById } from '../services/api'
import { v4 as uuidv4 } from 'uuid'

function ApplyJobPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Base states
  const [jobTitle, setJobTitle] = useState(location.state?.jobTitle || '')
  const [applicationId, setApplicationId] = useState(location.state?.applicationId || '')
  const [candidateId, setCandidateId] = useState(location.state?.candidateId || '')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  // AI Assessment states (New Feature)
  const [flowState, setFlowState] = useState('FORM') // 'FORM' | 'LOADING' | 'REJECTED' | 'ASSESSMENT' | 'SUBMITTING' | 'SUCCESS'
  const [loadingStep, setLoadingStep] = useState(0)
  const [assessmentData, setAssessmentData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds

  const answersRef = useRef({})
  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    setValue, 
    reset,
    formState: { errors } 
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      experience: ''
    }
  })

  // Prefill Data on Mount
  useEffect(() => {
    const loadApplicationData = async () => {
      setLoadingProfile(true)
      setErrorMsg('')
      
      // Ensure Application ID exists
      if (!applicationId) {
        setApplicationId(uuidv4())
      }

      // Ensure Candidate ID exists
      let currentCandidateId = candidateId
      if (!currentCandidateId) {
        const userString = localStorage.getItem('user')
        if (userString) {
          try {
            const user = JSON.parse(userString)
            if (user.candidate_id) {
              currentCandidateId = user.candidate_id
              setCandidateId(user.candidate_id)
            }
          } catch (e) {
            console.error('Failed to parse user from localStorage', e)
          }
        }
      }

      // 1. Fetch Job details if title is not passed
      if (!jobTitle && jobId) {
        try {
          const job = await getJobById(jobId)
          if (job && job.title) {
            setJobTitle(job.title)
          }
        } catch (err) {
          console.error('Failed to fetch job details:', err)
          setErrorMsg('Failed to fetch job details from backend.')
        }
      }

      // 2. Fetch Candidate details to prefill form fields
      if (currentCandidateId) {
        try {
          const profile = await getCandidateById(currentCandidateId)
          if (profile) {
            reset({
              name: profile.name || '',
              email: profile.email || '',
              phone: profile.phone_number || '',
              experience: ''
            })
          }
        } catch (err) {
          console.error('Failed to fetch candidate profile:', err)
        }
      }
      
      setLoadingProfile(false)
    }

    loadApplicationData()
  }, [jobId, candidateId, applicationId, jobTitle, reset])

  // Loading Steps Loop Timer
  useEffect(() => {
    if (flowState !== 'LOADING') return

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < 3) return prev + 1
        return prev
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [flowState])

  // Timer Countdown logic
  useEffect(() => {
    if (flowState !== 'ASSESSMENT') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [flowState])

  // Handle Resume Upload selection
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrorMsg('Only PDF resumes are accepted.')
        setSelectedFile(null)
        setValue('resume', null)
        return
      }
      setSelectedFile(file)
      setValue('resume', file, { shouldValidate: true })
      setErrorMsg('')
    }
  }

  // Submit Application Form to n8n Webhook
  const onSubmit = async (data) => {
    if (!selectedFile) {
      setErrorMsg('Resume PDF is required.')
      return
    }

    setFlowState('LOADING')
    setLoadingStep(0)
    setErrorMsg('')

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-production-ad84.up.railway.app/webhook/hireflow-apply'
      
      const formData = new FormData()
      formData.append('application_id', applicationId)
      formData.append('candidate_id', candidateId)
      formData.append('job_id', jobId)
      formData.append('job_role', jobTitle)
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('experience', data.experience)
      formData.append('resume', selectedFile)

      const response = await axios.post(webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Normalize array outputs from n8n webhooks
      let payload = response.data
      if (Array.isArray(payload) && payload.length > 0) {
        payload = payload[0]
      }

      if (payload?.status === 'REJECTED') {
        setFlowState('REJECTED')
      } else if (payload?.status === 'SELECTED') {
        // Hydrate questions list
        setAssessmentData(payload)
        setFlowState('ASSESSMENT')
      } else {
        // Fallback to success page if response structure does not match
        navigate('/application-success')
      }

    } catch (err) {
      console.error('Submission Error:', err)
      setErrorMsg(
        err.response?.data?.message || 
        err.message || 
        'Something went wrong while submitting your application. Please try again.'
      )
      setFlowState('FORM')
    }
  }

  // Handle auto-submitting the test when the timer expires
  const handleAutoSubmit = () => {
    submitTestAnswers(true)
  }

  // Post Answers JSON payload to n8n submit-test Webhook
  const submitTestAnswers = async (isAuto = false) => {
    setFlowState('SUBMITTING')
    setErrorMsg('')

    const testUrl = import.meta.env.VITE_N8N_SUBMIT_TEST_URL || 'https://n8n-production-ad84.up.railway.app/webhook/submit-test'
    const targetCandidateId = assessmentData?.candidate_id || candidateId
    const targetApplicationId = assessmentData?.application_id || applicationId
    const targetRole = assessmentData?.role || jobTitle

    // Format list questions to include answers
    const listAnswers = (assessmentData?.questions || []).map((q) => {
      const qId = q.question_id || q.id
      return {
        question_id: qId,
        answer: answersRef.current[qId] !== undefined ? answersRef.current[qId] : ""
      }
    })

    const payload = {
      candidate_id: targetCandidateId,
      application_id: targetApplicationId,
      role: targetRole,
      answers: listAnswers
    }

    try {
      await axios.post(testUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      setFlowState('SUCCESS')
    } catch (err) {
      console.error('Test Submission Error:', err)
      setErrorMsg('Failed to submit technical assessment to server. Please try again.')
      setFlowState('ASSESSMENT')
    }
  }

  // Utility to parse standard key-value options list for MCQ questions
  const getOptionsList = (q) => {
    if (Array.isArray(q.options)) {
      return q.options.map((opt, idx) => ({
        key: String.fromCharCode(65 + idx), // A, B, C, D
        text: opt
      }))
    } else if (q.options && typeof q.options === 'object') {
      return Object.entries(q.options).map(([k, val]) => ({
        key: k.toUpperCase(),
        text: val
      }))
    }
    // Fallback labels
    return [
      { key: 'A', text: q.option_a || q.optionA || 'Option A' },
      { key: 'B', text: q.option_b || q.optionB || 'Option B' },
      { key: 'C', text: q.option_c || q.optionC || 'Option C' },
      { key: 'D', text: q.option_d || q.optionD || 'Option D' }
    ]
  }

  // Format countdown seconds into MM:SS format
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`
  }

  // Render view helpers
  if (flowState === 'LOADING') {
    const steps = [
      { label: 'Checking Resume...', threshold: 0 },
      { label: 'Matching Skills...', threshold: 1 },
      { label: 'Generating Technical Assessment...', threshold: 2 },
      { label: 'Please wait...', threshold: 3 }
    ]
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl p-8 shadow-xl space-y-6 text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-800 font-display">Processing Application</h3>
            <p className="text-xs text-slate-450">Our AI shortlisting suite is scanning your candidate file...</p>
          </div>
          
          <div className="space-y-3.5 pt-4 text-left border-t border-slate-100">
            {steps.map((step, idx) => {
              const isDone = loadingStep > step.threshold
              const isActive = loadingStep === step.threshold
              return (
                <div key={idx} className="flex items-center gap-3 transition-all duration-300">
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${isDone ? 'text-slate-700' : isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-white border border-rose-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl mx-auto flex items-center justify-center text-rose-550 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">Application Submitted</h2>
            <p className="text-sm font-bold text-rose-600">Unfortunately your profile was not shortlisted.</p>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Thank you for applying. We have reviewed your background qualifications, and at this time we will not be moving forward with your candidacy. Please check your email for detailed information.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Back to Job Board
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'ASSESSMENT') {
    const questions = assessmentData?.questions || []
    const totalQuestions = questions.length
    const answeredCount = Object.keys(answers).length
    const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
        
        {/* Sticky Header Panel */}
        <header className="bg-white border-b border-slate-150 px-6 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                Live Test Mode
              </span>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight font-display mt-1">
                Technical Assessment — {assessmentData?.role || jobTitle}
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold">Candidate: {register('name').value || 'Shortlisted Profile'}</p>
            </div>
            
            {/* Sticky Timer */}
            <div className="flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
              <Clock className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              <div className="text-right">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold block">Time Remaining</span>
                <span className="text-sm font-black font-mono tracking-wider">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mt-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
              <span>Progress Bar</span>
              <span>{answeredCount} of {totalQuestions} completed</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="max-w-4xl w-full mx-auto px-6 mt-6">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Submission Failed</p>
                <p className="text-xs text-red-750">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Card Container */}
        <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-8 space-y-6">
          {questions.map((q, idx) => {
            const qId = q.question_id || q.id
            const isAnswered = answers[qId] !== undefined && answers[qId] !== ""
            return (
              <div 
                key={qId} 
                className={`bg-white border ${isAnswered ? 'border-indigo-150 shadow-indigo-50/10' : 'border-slate-200'} rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-650">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-800 pt-0.5 leading-relaxed">
                      {q.question}
                    </h3>
                  </div>
                  {isAnswered && (
                    <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-indigo-500" /> Answered
                    </span>
                  )}
                </div>

                {/* Render Question Inputs */}
                <div className="pt-2">
                  {q.type === 'mcq' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {getOptionsList(q).map((opt) => {
                        const isSelected = answers[qId] === opt.key
                        return (
                          <label 
                            key={opt.key}
                            className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-50/30 border-indigo-500 text-indigo-950 font-bold' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qId}`}
                              value={opt.key}
                              checked={isSelected}
                              onChange={() => setAnswers(prev => ({ ...prev, [qId]: opt.key }))}
                              className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                            />
                            <div className="text-xs leading-normal">
                              <span className="font-extrabold mr-1.5">{opt.key}.</span> {opt.text}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <textarea
                      placeholder="Type your response here..."
                      rows={4}
                      value={answers[qId] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed placeholder-slate-400"
                    />
                  )}

                  {q.type === 'number' && (
                    <input
                      type="number"
                      placeholder="Enter a numeric response..."
                      value={answers[qId] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                      className="w-48 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400"
                    />
                  )}
                </div>
              </div>
            )
          })}

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <Hourglass className="w-4 h-4" />
              <span>Test will auto-submit when the countdown expires.</span>
            </div>
            <button
              onClick={() => submitTestAnswers(false)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
            >
              Submit Assessment
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (flowState === 'SUBMITTING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <Loader2 className="w-12 h-12 text-indigo-650 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-800 font-display">Submitting Assessment</h3>
            <p className="text-xs text-slate-450">Packaging your responses and finalizing candidate entry...</p>
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-white border border-emerald-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl mx-auto flex items-center justify-center text-emerald-550 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">Assessment Submitted Successfully</h2>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Your responses have been received. Our AI Interview Engine is evaluating your answers. Final result will be shared via email shortly.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Return to Positions Portal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Default FORM View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/jobs" className="text-xs font-bold text-slate-555 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Apply Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -z-10" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest px-2.5 py-1 bg-indigo-500/15 rounded-full border border-indigo-400/20">
                Job Application
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight font-display">
                {jobTitle || 'Loading Position Details...'}
              </h1>
              <p className="text-xs text-indigo-200/80">Complete the details below to submit your resume for review.</p>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
              <div className="text-left">
                <p className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-wide">Recruitment Method</p>
                <p className="text-xs font-bold text-indigo-100">AI Screened Pipeline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold">Application Error</p>
              <p className="text-xs text-red-750">{errorMsg}</p>
            </div>
          </div>
        )}

        {loadingProfile ? (
          <div className="bg-white border border-slate-155 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 font-display">Configuring secure session and fetching profile details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Metadata Info Panel (Readonly) */}
            <div className="bg-white border border-slate-155 rounded-2xl p-5 shadow-sm space-y-5">
              <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Session Metadata
              </h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Application ID</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block" title={applicationId}>
                    {applicationId || 'Generating...'}
                  </span>
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Candidate ID</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block" title={candidateId}>
                    {candidateId || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Job ID</span>
                  <span className="font-semibold text-slate-700 block">
                    {jobId || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Position Role</span>
                  <span className="font-bold text-brand-650 flex items-center gap-1.5 mt-0.5">
                    <BriefcaseBusiness className="w-3.5 h-3.5" />
                    {jobTitle || 'Generic Position'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-155 rounded-xl p-3.5 text-[11px] text-slate-550 leading-relaxed space-y-1.5">
                <div className="flex gap-1.5 items-start">
                  <ShieldAlert className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                  <span>These fields are automatically system-managed and submitted securely.</span>
                </div>
              </div>
            </div>

            {/* Editable Form Panel */}
            <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold text-surface-900 font-display pb-3 border-b border-slate-100">
                Candidate Profile Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your name"
                    {...register('name', { required: 'Name is required' })}
                    className={`w-full bg-slate-50 border ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-brand-500'} rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none transition-colors`}
                  />
                  {errors.name && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name.message}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="name@example.com"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className={`w-full bg-slate-50 border ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-brand-500'} rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none transition-colors`}
                  />
                  {errors.email && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    id="phone"
                    placeholder="+91 XXXXX XXXXX"
                    {...register('phone', { required: 'Phone number is required' })}
                    className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-brand-500'} rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none transition-colors`}
                  />
                  {errors.phone && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone.message}
                    </span>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label htmlFor="experience" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BriefcaseBusiness className="w-3.5 h-3.5 text-slate-400" />
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    id="experience"
                    placeholder="e.g. 3"
                    min="0"
                    max="50"
                    {...register('experience', { 
                      required: 'Experience is required',
                      min: { value: 0, message: 'Experience cannot be negative' }
                    })}
                    className={`w-full bg-slate-50 border ${errors.experience ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-brand-500'} rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none transition-colors`}
                  />
                  {errors.experience && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.experience.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Resume Upload Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Upload Resume (PDF Only) *
                </label>
                
                <div className={`border-2 border-dashed ${selectedFile ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'} rounded-2xl p-6 transition-all relative flex flex-col items-center justify-center text-center cursor-pointer`}>
                  <input
                    type="file"
                    id="resume"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className={`w-11 h-11 rounded-xl mx-auto flex items-center justify-center ${selectedFile ? 'bg-indigo-500/15 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Upload className="w-5 h-5" />
                    </div>
                    
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-450">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF file selected</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">Drag your resume file here, or browse</p>
                        <p className="text-[10px] text-slate-450">PDF format only. Maximum file size 10MB.</p>
                      </div>
                    )}
                  </div>
                </div>
                {errors.resume && !selectedFile && (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Resume PDF is required
                  </span>
                )}
              </div>

              {/* Form Action Row */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default ApplyJobPage
