import React, { useState, useEffect } from 'react'
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
  Sparkles
} from 'lucide-react'
import axios from 'axios'
import { getJobById, getCandidateById } from '../services/api'
import { v4 as uuidv4 } from 'uuid'

function ApplyJobPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // States
  const [jobTitle, setJobTitle] = useState(location.state?.jobTitle || '')
  const [applicationId, setApplicationId] = useState(location.state?.applicationId || '')
  const [candidateId, setCandidateId] = useState(location.state?.candidateId || '')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

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

  // Handle Submission
  const onSubmit = async (data) => {
    if (!selectedFile) {
      setErrorMsg('Resume PDF is required.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n-production-ad84.up.railway.app/webhook/hireflow-apply'
      
      // Construct Multipart Form Data
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

      // Post to webhook endpoint
      const response = await axios.post(webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        navigate('/application-success')
      } else {
        throw new Error('Received non-success status from application endpoint.')
      }
    } catch (err) {
      console.error('Submission Error:', err)
      setErrorMsg(
        err.response?.data?.message || 
        err.message || 
        'Something went wrong while submitting your application. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

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
          <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 font-display">Configuring secure session and fetching profile details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Metadata Info Panel (Readonly) */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-5">
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
                    type="tel"
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
                  disabled={submitting}
                  onClick={() => navigate('/jobs')}
                  className="bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                    </>
                  )}
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
