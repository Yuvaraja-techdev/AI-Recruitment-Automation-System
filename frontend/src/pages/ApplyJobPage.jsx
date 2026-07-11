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
  const [jobDetails, setJobDetails] = useState(null)
  const [candidateProfile, setCandidateProfile] = useState(null)

  // AI Assessment states (New Feature)
  const [flowState, setFlowState] = useState('FORM') // 'FORM' | 'LOADING' | 'REJECTED' | 'SHORTLIST' | 'PREPARING' | 'ASSESSMENT' | 'SUBMITTING' | 'SUCCESS'
  const [loadingStep, setLoadingStep] = useState(0)
  const [assessmentData, setAssessmentData] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes in seconds
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

  // Shuffling, Anti-Cheat, and Flagging States (Part 2)
  const [shuffledQuestions, setShuffledQuestions] = useState([])
  const [warningCount, setWarningCount] = useState(0)
  const [antiCheatModal, setAntiCheatModal] = useState({ show: false, title: '', message: '' })
  const [flagged, setFlagged] = useState({})
  const [timeWarningsShown, setTimeWarningsShown] = useState({ fiveMin: false, oneMin: false })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const answersRef = useRef({})
  const questionTimesRef = useRef({})

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

  const clearSession = () => {
    localStorage.removeItem('hireflow_flow_state')
    localStorage.removeItem('hireflow_assessment_data')
    localStorage.removeItem('hireflow_answers')
    localStorage.removeItem('hireflow_active_application_id')
    localStorage.removeItem('hireflow_active_candidate_id')
    localStorage.removeItem('hireflow_active_job_title')
    localStorage.removeItem('hireflow_active_question_index')
    localStorage.removeItem('hireflow_question_times')
    localStorage.removeItem('hireflow_active_job_id')
    localStorage.removeItem('hireflow_candidate_info')
    
    // Clear Part 2 variables
    if (assessmentData) {
      const assessmentKey = `hireflow_test_${assessmentData.assessment_id || assessmentData.application_id}`
      localStorage.removeItem(`${assessmentKey}_shuffled_questions`)
      localStorage.removeItem(`${assessmentKey}_started_at`)
      localStorage.removeItem(`${assessmentKey}_end_time`)
      localStorage.removeItem(`hireflow_warning_count_${assessmentData.assessment_id || assessmentData.application_id}`)
    }
    localStorage.removeItem('hireflow_flagged')
  }

  // Prefill Data on Mount & Resume Session
  useEffect(() => {
    const loadApplicationData = async () => {
      setLoadingProfile(true)
      setErrorMsg('')

      // 1. Load saved candidate details from localStorage if present
      const savedInfo = localStorage.getItem('hireflow_candidate_info')
      if (savedInfo) {
        try {
          setCandidateProfile(JSON.parse(savedInfo))
        } catch (e) {
          console.error('Failed to parse candidate info:', e)
        }
      }

      // 2. Load Job details if jobId is available
      let loadedJob = null
      if (jobId) {
        try {
          loadedJob = await getJobById(jobId)
          if (loadedJob) {
            setJobDetails(loadedJob)
            if (!jobTitle && loadedJob.title) {
              setJobTitle(loadedJob.title)
            }
          }
        } catch (err) {
          console.error('Failed to fetch job details:', err)
        }
      }

      // 3. Resolve Candidate ID
      let currentCandidateId = candidateId || localStorage.getItem('hireflow_active_candidate_id')
      if (!currentCandidateId) {
        const userString = localStorage.getItem('user')
        if (userString) {
          try {
            const user = JSON.parse(userString)
            if (user.candidate_id) {
              currentCandidateId = user.candidate_id
            }
          } catch (e) {
            console.error('Failed to parse user from localStorage', e)
          }
        }
      }

      // 4. Fetch Candidate profile from database if available
      let profile = null
      if (currentCandidateId) {
        try {
          profile = await getCandidateById(currentCandidateId)
          if (profile) {
            setCandidateProfile(prev => ({ ...profile, ...prev }))
          }
        } catch (err) {
          console.error('Failed to fetch candidate profile:', err)
        }
      }

      // Try to resume session from localStorage
      const savedFlowState = localStorage.getItem('hireflow_flow_state')
      const savedAssessmentData = localStorage.getItem('hireflow_assessment_data')
      const savedAnswers = localStorage.getItem('hireflow_answers')
      const savedAppId = localStorage.getItem('hireflow_active_application_id')
      const savedCandId = localStorage.getItem('hireflow_active_candidate_id')
      const savedJobTitle = localStorage.getItem('hireflow_active_job_title')
      const savedActiveIdx = localStorage.getItem('hireflow_active_question_index')
      const savedJobId = localStorage.getItem('hireflow_active_job_id')

      // Verify that the saved session belongs to the current job and application
      const isSameJob = savedJobId === jobId
      const isSameApplication = !location.state?.applicationId || savedAppId === location.state.applicationId

      if (isSameJob && isSameApplication && savedFlowState && savedFlowState !== 'FORM' && savedFlowState !== 'LOADING' && savedAssessmentData) {
        try {
          const parsedData = JSON.parse(savedAssessmentData)
          setAssessmentData(parsedData)
          setFlowState(savedFlowState)
          
          if (savedAnswers) {
            setAnswers(JSON.parse(savedAnswers))
          }
          if (savedAppId) setApplicationId(savedAppId)
          if (savedCandId) setCandidateId(savedCandId)
          if (savedJobTitle) setJobTitle(savedJobTitle)
          if (savedActiveIdx) setActiveQuestionIndex(parseInt(savedActiveIdx, 10))
          
          const assessmentKey = `hireflow_test_${parsedData.assessment_id || parsedData.application_id}`
          
          // Load shuffled questions
          const savedShuffled = localStorage.getItem(`${assessmentKey}_shuffled_questions`)
          if (savedShuffled) {
            setShuffledQuestions(JSON.parse(savedShuffled))
          }
          
          // Load warning count
          const savedWarnings = localStorage.getItem(`hireflow_warning_count_${parsedData.assessment_id || parsedData.application_id}`)
          if (savedWarnings) {
            setWarningCount(parseInt(savedWarnings, 10))
          }
          
          // Load flagged questions
          const savedFlagged = localStorage.getItem('hireflow_flagged')
          if (savedFlagged) {
            setFlagged(JSON.parse(savedFlagged))
          }

          // Load question times
          const savedTimes = localStorage.getItem('hireflow_question_times')
          if (savedTimes) {
            questionTimesRef.current = JSON.parse(savedTimes)
          }

          // Calculate remaining time if in ASSESSMENT state
          if (savedFlowState === 'ASSESSMENT') {
            const storedEndTime = localStorage.getItem(`${assessmentKey}_end_time`)
            if (storedEndTime) {
              const remaining = Math.max(0, Math.round((parseInt(storedEndTime, 10) - Date.now()) / 1000))
              setTimeLeft(remaining)
            } else {
              setTimeLeft(1200)
            }
          }
          
          setLoadingProfile(false)
          return // Skip loading normal profile data since we are resuming
        } catch (e) {
          console.error('Failed to resume session from localStorage:', e)
          clearSession()
        }
      } else {
        // Clear any stale session data from previous jobs/applications
        clearSession()
      }
      
      // Ensure Application ID exists
      if (!applicationId) {
        const randomNum = Math.floor(100 + Math.random() * 900)
        setApplicationId(`APP${randomNum}`)
      }

      // Ensure Candidate ID exists
      if (!candidateId) {
        if (currentCandidateId) {
          setCandidateId(currentCandidateId)
        } else {
          const randomNum = Math.floor(100 + Math.random() * 900)
          const generatedCandId = `CAND${randomNum}`
          setCandidateId(generatedCandId)
        }
      }

      // Prefill candidate details to form fields
      const activeProfile = profile || (savedInfo ? JSON.parse(savedInfo) : null)
      if (activeProfile) {
        reset({
          name: activeProfile.name || '',
          email: activeProfile.email || '',
          phone: activeProfile.phone_number || activeProfile.phone || '',
          experience: activeProfile.experience || ''
        })
      }
      
      setLoadingProfile(false)
    }

    loadApplicationData()
  }, [jobId, candidateId, applicationId, jobTitle, reset])

  // Clear session if finished or rejected
  useEffect(() => {
    if (flowState === 'SUCCESS' || flowState === 'REJECTED') {
      clearSession()
    }
  }, [flowState])

  // Auto-save session variables to localStorage on change
  useEffect(() => {
    if (flowState === 'FORM' || flowState === 'LOADING' || flowState === 'SUCCESS' || flowState === 'REJECTED') {
      return
    }
    localStorage.setItem('hireflow_flow_state', flowState)
    if (assessmentData) {
      localStorage.setItem('hireflow_assessment_data', JSON.stringify(assessmentData))
    }
    localStorage.setItem('hireflow_answers', JSON.stringify(answers))
    localStorage.setItem('hireflow_active_application_id', applicationId)
    localStorage.setItem('hireflow_active_candidate_id', candidateId)
    localStorage.setItem('hireflow_active_job_title', jobTitle)
    localStorage.setItem('hireflow_active_question_index', activeQuestionIndex.toString())
    localStorage.setItem('hireflow_flagged', JSON.stringify(flagged))
    localStorage.setItem('hireflow_active_job_id', jobId)
  }, [flowState, assessmentData, answers, applicationId, candidateId, jobTitle, activeQuestionIndex, flagged, jobId])

  // Online/Offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Browser Exit Warning (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (flowState === 'ASSESSMENT') {
        const message = "You have an ongoing assessment. Are you sure you want to leave? Your progress is saved, but the timer will continue running."
        e.returnValue = message
        return message
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [flowState])

  // Anti-Cheat Events Listener
  useEffect(() => {
    if (flowState !== 'ASSESSMENT' || !assessmentData) return

    const handleViolation = (eventDetail) => {
      if (flowState === 'SUBMITTING' || flowState === 'SUCCESS') return

      setWarningCount((prev) => {
        const nextCount = prev + 1
        localStorage.setItem(`hireflow_warning_count_${assessmentData?.assessment_id || assessmentData?.application_id}`, nextCount.toString())

        if (nextCount === 1) {
          setAntiCheatModal({
            show: true,
            title: "Security Alert - Warning 1",
            message: "Please stay on the assessment page. If you switch tabs, lose focus, or exit fullscreen again, the test will be automatically submitted."
          })
        } else if (nextCount === 2) {
          setAntiCheatModal({
            show: true,
            title: "Security Alert - Warning 2 (Final Warning)",
            message: "This is your final warning. Any further action outside this page will result in immediate automatic submission of your assessment."
          })
        } else if (nextCount >= 3) {
          setAntiCheatModal({
            show: false,
            title: "",
            message: ""
          })
          // Auto submit due to system termination
          handleSubmitAssessment(true, 'TERMINATED_BY_SYSTEM')
        }
        return nextCount
      })
    }

    // 1. Tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switched")
      }
    }

    // 2. Window focus/blur
    const handleWindowBlur = () => {
      handleViolation("Window lost focus")
    }

    // 3. Fullscreen exit change
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!isFullscreen && flowState === 'ASSESSMENT') {
        handleViolation("Exited Fullscreen")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [flowState, assessmentData])

  // Custom Time warnings logic
  useEffect(() => {
    if (flowState !== 'ASSESSMENT') return

    if (timeLeft === 305) { // trigger warning around 5 min (300)
      setTimeWarningsShown(prev => {
        if (!prev.fiveMin) {
          setAntiCheatModal({
            show: true,
            title: "Time Notice - 5 Minutes Left",
            message: "You have 5 minutes remaining. Please review your answers and prepare to submit."
          })
          return { ...prev, fiveMin: true }
        }
        return prev
      })
    } else if (timeLeft === 65) { // trigger warning around 1 min (60)
      setTimeWarningsShown(prev => {
        if (!prev.oneMin) {
          setAntiCheatModal({
            show: true,
            title: "Time Alert - 1 Minute Left",
            message: "Only 1 minute remains. The assessment will submit automatically in 60 seconds."
          })
          return { ...prev, oneMin: true }
        }
        return prev
      })
    }
  }, [timeLeft, flowState, timeWarningsShown])

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
    if (flowState !== 'ASSESSMENT' || !assessmentData) return

    const assessmentKey = `hireflow_test_${assessmentData.assessment_id || assessmentData.application_id}`
    
    let timerInterval;

    const updateTimer = () => {
      const storedEndTime = localStorage.getItem(`${assessmentKey}_end_time`)
      if (!storedEndTime) return
      
      const endTime = parseInt(storedEndTime, 10)
      const now = Date.now()
      const diff = Math.max(0, Math.round((endTime - now) / 1000))
      
      setTimeLeft(diff)
      
      if (diff <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval)
        }
        handleAutoSubmit()
      }
    }

    timerInterval = setInterval(updateTimer, 1000)

    // Initial check
    updateTimer()

    return () => clearInterval(timerInterval)
  }, [flowState, assessmentData])

  // Track time spent per question
  useEffect(() => {
    if (flowState !== 'ASSESSMENT' || !assessmentData) return

    const questions = shuffledQuestions.length > 0 ? shuffledQuestions : (assessmentData?.assessment?.questions || assessmentData?.questions || [])
    if (questions.length === 0) return

    const activeQuestion = questions[activeQuestionIndex]
    if (!activeQuestion) return
    const activeQId = activeQuestion.question_id || activeQuestion.id

    const timer = setInterval(() => {
      if (!questionTimesRef.current[activeQId]) {
        questionTimesRef.current[activeQId] = 0
      }
      questionTimesRef.current[activeQId] += 1
      localStorage.setItem('hireflow_question_times', JSON.stringify(questionTimesRef.current))
    }, 1000)

    return () => clearInterval(timer)
  }, [flowState, assessmentData, activeQuestionIndex, shuffledQuestions])

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

    // Save candidate inputs to state and localStorage to prevent loss on reload
    const candidateInfo = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      experience: data.experience,
      resume: selectedFile?.name || ""
    }
    setCandidateProfile(candidateInfo)
    localStorage.setItem('hireflow_candidate_info', JSON.stringify(candidateInfo))

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
        // Hydrate questions list & resolve returned IDs
        const finalCandidateId = payload.candidate_id || candidateId
        const finalApplicationId = payload.application_id || applicationId
        
        setCandidateId(finalCandidateId)
        setApplicationId(finalApplicationId)
        
        // Update user state if candidate_id is returned
        if (payload.candidate_id) {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            try {
              const parsedUser = JSON.parse(userStr)
              parsedUser.candidate_id = payload.candidate_id
              localStorage.setItem('user', JSON.stringify(parsedUser))
            } catch (e) {
              console.error("Error updating user candidate_id", e)
            }
          }
        }

        const updatedPayload = {
          ...payload,
          candidate_id: finalCandidateId,
          application_id: finalApplicationId,
          candidate_name: data.name,
          email: data.email,
          phone: data.phone,
          experience: data.experience,
          resume_id: payload.id || "",
          resume_url: payload.id ? `https://drive.google.com/file/d/${payload.id}/view` : ""
        }
        setAssessmentData(updatedPayload)
        setFlowState('SHORTLIST')
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
    handleSubmitAssessment(true)
  }

  const startAssessment = () => {
    if (!assessmentData) return
    setFlowState('PREPARING')
    setLoadingStep(0)
    
    // Simulate prep loading screen over 2 seconds (4 steps * 500ms)
    let step = 0
    const interval = setInterval(() => {
      step += 1
      setLoadingStep(step)
      if (step >= 4) {
        clearInterval(interval)
        
        const assessmentKey = `hireflow_test_${assessmentData.assessment_id || assessmentData.application_id}`
        
        // Save Started At
        let startedAt = localStorage.getItem(`${assessmentKey}_started_at`)
        if (!startedAt) {
          startedAt = new Date().toISOString()
          localStorage.setItem(`${assessmentKey}_started_at`, startedAt)
        }
        
        // Calculate End Time
        let storedEndTime = localStorage.getItem(`${assessmentKey}_end_time`)
        let endTime;
        if (!storedEndTime) {
          endTime = Date.now() + 20 * 60 * 1000
          localStorage.setItem(`${assessmentKey}_end_time`, endTime.toString())
        } else {
          endTime = parseInt(storedEndTime, 10)
        }

        // Shuffle questions and options if not already done
        initializeShuffle(assessmentKey)

        const remainingSecs = Math.max(0, Math.round((endTime - Date.now()) / 1000))
        setTimeLeft(remainingSecs)
        setFlowState('ASSESSMENT')
        
        // Request fullscreen
        requestFullscreen()
      }
    }, 500)
  }

  const initializeShuffle = (assessmentKey) => {
    const rawQuestions = assessmentData?.assessment?.questions || assessmentData?.questions || []
    
    // Check if we already have shuffled questions saved in localStorage
    const savedShuffled = localStorage.getItem(`${assessmentKey}_shuffled_questions`)
    if (savedShuffled) {
      try {
        setShuffledQuestions(JSON.parse(savedShuffled))
        return
      } catch (e) {
        console.error("Error parsing saved shuffled questions", e)
      }
    }
    
    // Perform Shuffling
    // 1. Shuffle Questions
    const questionsToShuffle = [...rawQuestions]
    for (let i = questionsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionsToShuffle[i], questionsToShuffle[j]] = [questionsToShuffle[j], questionsToShuffle[i]];
    }
    
    // 2. Shuffle Options for MCQ questions
    const processedQuestions = questionsToShuffle.map((q) => {
      if (q.type === 'mcq') {
        const optionsList = getOptionsList(q) // returns array of {key: 'A', text: '...'}
        // Shuffle the options list
        const shuffledOpts = [...optionsList]
        for (let i = shuffledOpts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOpts[i], shuffledOpts[j]] = [shuffledOpts[j], shuffledOpts[i]];
        }
        return {
          ...q,
          shuffled_options: shuffledOpts
        }
      }
      return q
    })
    
    setShuffledQuestions(processedQuestions)
    localStorage.setItem(`${assessmentKey}_shuffled_questions`, JSON.stringify(processedQuestions))
  }

  const requestFullscreen = () => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log("Fullscreen request failed:", err))
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  }

  const handleCloseWarningModal = () => {
    setAntiCheatModal({ show: false, title: '', message: '' })
    requestFullscreen()
  }

  const toggleFlag = (qId) => {
    setFlagged((prev) => {
      const nextFlagged = { ...prev, [qId]: !prev[qId] }
      localStorage.setItem('hireflow_flagged', JSON.stringify(nextFlagged))
      return nextFlagged
    })
  }

  const getRenderOptions = (q) => {
    if (q.shuffled_options) {
      return q.shuffled_options
    }
    return getOptionsList(q)
  }

  const getDifficultyStyle = (difficulty) => {
    const diff = String(difficulty).toLowerCase()
    if (diff === 'easy') {
      return 'bg-emerald-50 border-emerald-150 text-emerald-700'
    } else if (diff === 'medium') {
      return 'bg-blue-50 border-blue-150 text-blue-700'
    } else if (diff === 'hard') {
      return 'bg-amber-50 border-amber-150 text-amber-700'
    } else if (diff === 'hr' || diff === 'behavioral') {
      return 'bg-purple-50 border-purple-150 text-purple-700'
    }
    return 'bg-slate-50 border-slate-150 text-slate-700'
  }

  // Post Answers JSON payload to n8n submit-test Webhook
  const handleSubmitAssessment = async (isAuto = false, cheatTerminated = null) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    if (!isAuto && !cheatTerminated) {
      const confirmSubmit = window.confirm("Are you sure you want to submit your assessment? After submission you cannot edit your answers.")
      if (!confirmSubmit) {
        setIsSubmitting(false)
        return
      }
    }

    setFlowState('SUBMITTING')
    setErrorMsg('')

    const testUrl = import.meta.env.VITE_N8N_SUBMIT_TEST_URL || 'https://n8n-production-ad84.up.railway.app/webhook/submit-test'
    const targetCandidateId = assessmentData?.candidate_id || candidateId
    const targetApplicationId = assessmentData?.application_id || applicationId
    const targetRole = assessmentData?.role || jobTitle
    
    // Safely resolve email using state fallbacks
    let targetEmail = assessmentData?.email || candidateProfile?.email
    if (!targetEmail) {
      try {
        const userObj = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
        targetEmail = userObj?.email || ""
      } catch (e) {
        targetEmail = ""
      }
    }

    // Safely resolve candidate name using state fallbacks
    let targetCandidateName = assessmentData?.candidate_name || assessmentData?.name || candidateProfile?.name
    if (!targetCandidateName) {
      try {
        const userObj = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
        targetCandidateName = userObj?.name || "Candidate"
      } catch (e) {
        targetCandidateName = "Candidate"
      }
    }

    // Resolve other candidate details
    const targetPhone = assessmentData?.phone || candidateProfile?.phone_number || candidateProfile?.phone || ""
    const targetExperience = assessmentData?.experience !== undefined ? assessmentData.experience : (candidateProfile?.experience || 0)
    
    // Resolve resume details
    const targetResumeId = assessmentData?.resume_id || assessmentData?.id || ""
    const targetResumeUrl = assessmentData?.resume_url || (targetResumeId ? `https://drive.google.com/file/d/${targetResumeId}/view` : "")
    
    // Resolve job details
    const targetJobId = jobId || assessmentData?.job_id || ""
    const targetJobDescription = jobDetails?.description || assessmentData?.job_description || ""
    const targetRequiredSkills = jobDetails?.skills || assessmentData?.required_skills || []
    
    // Resolve assessment ID
    const targetAssessmentId = assessmentData?.assessment_id || "ASM001"

    // Extract questions list safely (using shuffled if available)
    const questionsList = shuffledQuestions.length > 0
      ? shuffledQuestions
      : (assessmentData?.assessment?.questions || assessmentData?.questions || [])

    // Format list questions to include full metadata and answers
    const listAnswers = questionsList.map((q) => {
      const qId = q.question_id || q.id
      const answerVal = answersRef.current[qId] !== undefined ? answersRef.current[qId] : ""
      const timeSpent = questionTimesRef.current[qId] || 0
      return {
        question_id: qId,
        question: q.question || "",
        difficulty: q.difficulty || "easy",
        type: q.type || "mcq",
        selected_answer: answerVal,
        answer: answerVal,
        time_spent: timeSpent
      }
    })

    // Compute status
    let status = 'SUBMITTED'
    if (cheatTerminated === 'TERMINATED_BY_SYSTEM') {
      status = 'TERMINATED_BY_SYSTEM'
    } else if (isAuto) {
      status = 'EXPIRED'
    }

    const assessmentKey = `hireflow_test_${assessmentData?.assessment_id || assessmentData?.application_id}`
    const startedAt = localStorage.getItem(`${assessmentKey}_started_at`) || new Date().toISOString()
    const storedEndTime = localStorage.getItem(`${assessmentKey}_end_time`)
    const endsAt = storedEndTime ? new Date(parseInt(storedEndTime, 10)).toISOString() : new Date().toISOString()

    const payload = {
      application_id: targetApplicationId,
      candidate_id: targetCandidateId,
      candidate_name: targetCandidateName,
      email: targetEmail,
      phone: targetPhone,
      role: targetRole,
      experience: targetExperience,
      resume_id: targetResumeId,
      resume_url: targetResumeUrl,
      assessment_id: targetAssessmentId,
      job_id: targetJobId,
      job_description: targetJobDescription,
      required_skills: targetRequiredSkills,
      submitted_at: new Date().toISOString(),
      answers: listAnswers,
      time_taken: Math.max(0, 1200 - timeLeft),
      
      // Preserve metadata for backward compatibility / existing n8n integrations:
      assessment_token: assessmentData?.assessment_token || "",
      auto_submitted: isAuto,
      assessment_created_at: assessmentData?.created_at || new Date(Date.now() - 1000 * 60).toISOString(),
      assessment_started_at: startedAt,
      assessment_ends_at: endsAt,
      assessment_status: status
    }

    try {
      const res = await axios.post(testUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const responseStatus = res.data?.status || (res.status === 200 ? "SUCCESS" : "ERROR")

      if (responseStatus === "SUCCESS" || responseStatus === "success") {
        clearSession()
        setFlowState('SUCCESS')
      } else {
        const errorDetail = res.data?.message || 'Failed to submit technical assessment to server. Please try again.'
        setErrorMsg(errorDetail)
        setFlowState('ASSESSMENT')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Test Submission Error:', err)
      const errorMsgText = err.response?.data?.message || err.message || 'Failed to submit technical assessment to server. Please try again.'
      setErrorMsg(errorMsgText)
      setFlowState('ASSESSMENT')
      setIsSubmitting(false)
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

  if (flowState === 'PREPARING') {
    const prepSteps = [
      { label: 'Loading Questions...', threshold: 0 },
      { label: 'Preparing Secure Environment...', threshold: 1 },
      { label: 'Timer Sync...', threshold: 2 },
      { label: 'Initializing Fullscreen...', threshold: 3 }
    ]
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans text-white">
        <div className="w-full max-w-md bg-slate-850 border border-slate-750 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-100 font-display">Setting Up Secure Session</h3>
            <p className="text-xs text-slate-400">Please do not switch tabs or minimize the browser...</p>
          </div>
          
          <div className="space-y-3.5 pt-4 text-left border-t border-slate-750">
            {prepSteps.map((step, idx) => {
              const isDone = loadingStep > step.threshold
              const isActive = loadingStep === step.threshold
              return (
                <div key={idx} className="flex items-center gap-3 transition-all duration-300">
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-450 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-700 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${isDone ? 'text-slate-350' : isActive ? 'text-indigo-400 font-bold' : 'text-slate-550'}`}>
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
            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              Thank you for applying. <br />
              Our AI Resume Screening has completed. <br />
              Unfortunately you were not shortlisted for the next round. <br />
              Please check your email for more information.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Return to Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'SHORTLIST') {
    const totalQ = assessmentData?.assessment?.total_questions || assessmentData?.total_questions || 20
    const totalMarks = assessmentData?.assessment?.total_marks || assessmentData?.total_marks || 10
    const passingMarks = assessmentData?.assessment?.passing_marks || assessmentData?.passing_marks || 6
    const duration = assessmentData?.assessment?.duration_minutes || assessmentData?.duration_minutes || 20

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold text-xs">
                HF
              </span>
              <span className="text-xs font-bold text-slate-800 font-display">HireFlow AI</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Shortlisted
            </span>
          </div>
        </header>

        <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
          {/* Congratulations Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl mx-auto flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight font-display">Congratulations!</h2>
              <p className="text-sm text-indigo-200/90 font-semibold">You have successfully cleared the AI Resume Screening.</p>
              <p className="text-xs text-slate-400 pt-1">Below is your Technical Assessment information.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Assessment Info & Sections */}
            <div className="lg:col-span-2 space-y-6">
              {/* Metadata Grid */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">
                  Assessment Metadata
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Assessment ID</span>
                    <span className="font-mono text-slate-800 font-bold block">{assessmentData?.assessment_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Candidate Name</span>
                    <span className="text-slate-800 font-bold block">{assessmentData?.candidate_name || register('name').value || 'Candidate'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Applied Role</span>
                    <span className="text-slate-850 font-extrabold flex items-center gap-1.5 mt-0.5">
                      <BriefcaseBusiness className="w-4 h-4 text-indigo-650" />
                      {assessmentData?.role || jobTitle}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 sm:col-span-2 pt-4 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wide block">Duration</span>
                      <span className="text-indigo-650 font-black text-sm block mt-0.5">{duration} Min</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wide block">Questions</span>
                      <span className="text-indigo-650 font-black text-sm block mt-0.5">{totalQ}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wide block">Total Marks</span>
                      <span className="text-indigo-650 font-black text-sm block mt-0.5">{totalMarks}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wide block">Passing Marks</span>
                      <span className="text-indigo-650 font-black text-sm block mt-0.5">{passingMarks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections breakdown */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 font-display">
                    Assessment Structure
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Difficulty levels and structure of the technical round</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-55 border border-slate-150">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">Section 1 (Easy)</span>
                      <span className="text-[10px] text-slate-450 font-medium">5 MCQs + 1 Short Answer</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      6 Qs
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-55 border border-slate-150">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">Section 2 (Medium)</span>
                      <span className="text-[10px] text-slate-450 font-medium">6 MCQs + 2 Text Answers</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                      8 Qs
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-55 border border-slate-150">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">Section 3 (Hard)</span>
                      <span className="text-[10px] text-slate-455 font-medium">2 MCQs + 2 Scenario Qs</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                      4 Qs
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-55 border border-slate-150">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">Section 4 (HR Round)</span>
                      <span className="text-[10px] text-slate-455 font-medium">2 Behavioral Text Answers</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full uppercase">
                      2 Qs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Rules & Actions */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5 font-display">
                  <ShieldAlert className="w-4 h-4 text-indigo-655" />
                  Rules & Instructions
                </h3>
                <ul className="space-y-3 text-[11px] text-slate-600 leading-relaxed font-semibold">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-650 font-bold mt-0.5">•</span>
                    <span>Total Time: <strong>20 Minutes</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-650 font-bold mt-0.5">•</span>
                    <span>Timer starts immediately after clicking Start Assessment.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-650 font-bold mt-0.5">•</span>
                    <span>Assessment can be attempted only once.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Every question carries equal marks. No negative marking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Once time expires the assessment will automatically submit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Refreshing the page will <strong>not</strong> reset the timer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Switching tabs will <strong>not</strong> stop the timer.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Candidate cannot go back after submission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-655 font-bold mt-0.5">•</span>
                    <span>Do not close the browser while taking the test.</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={startAssessment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 active:scale-[0.98] hover:translate-y-[-1px]"
              >
                START ASSESSMENT
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (flowState === 'ASSESSMENT') {
    const questions = shuffledQuestions.length > 0 ? shuffledQuestions : (assessmentData?.assessment?.questions || assessmentData?.questions || [])
    const totalQuestions = questions.length
    const answeredCount = Object.keys(answers).length
    const flaggedCount = Object.values(flagged).filter(Boolean).length
    
    const activeQuestion = questions[activeQuestionIndex]
    const qId = activeQuestion ? (activeQuestion.question_id || activeQuestion.id) : null

    // Get progress blocks text e.g. ██████░░░░░ 60%
    const getProgressBarText = () => {
      if (totalQuestions === 0) return "░░░░░░░░░░ 0%"
      const percentage = Math.round((answeredCount / totalQuestions) * 100)
      const filledBlocks = Math.round(percentage / 10)
      const emptyBlocks = 10 - filledBlocks
      const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks)
      return `${bar} ${percentage}%`
    }

    const preventCheatEvents = (e) => {
      e.preventDefault()
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24 select-none">
        
        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="bg-rose-600 text-white text-xs font-black text-center py-2 px-4 sticky top-0 z-[60] flex items-center justify-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span>Internet disconnected. Trying to reconnect... Answers are still saved locally.</span>
          </div>
        )}

        {/* Sticky Header Panel */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-50 shadow-md text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-650 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-500/20 font-display">
                HF
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight font-display">
                  HireFlow AI Assessment
                </h1>
                <p className="text-[10px] text-slate-405 font-semibold">
                  {assessmentData?.role || jobTitle}
                </p>
              </div>
            </div>

            {/* Assessment Progress Stats */}
            <div className="flex items-center gap-4 text-xs font-semibold bg-slate-855 px-4 py-2 border border-slate-750 rounded-2xl">
              <div className="text-center">
                <span className="text-[9px] text-slate-450 block uppercase font-bold">Answered</span>
                <span className="text-emerald-450 font-bold text-xs">{answeredCount}</span>
              </div>
              <div className="w-px h-6 bg-slate-750" />
              <div className="text-center">
                <span className="text-[9px] text-slate-450 block uppercase font-bold">Remaining</span>
                <span className="text-indigo-305 font-bold text-xs">{totalQuestions - answeredCount}</span>
              </div>
              <div className="w-px h-6 bg-slate-750" />
              <div className="text-center">
                <span className="text-[9px] text-slate-450 block uppercase font-bold">Flagged</span>
                <span className="text-amber-400 font-bold text-xs">{flaggedCount}</span>
              </div>
            </div>

            {/* ASCII progress bar */}
            <div className="flex items-center gap-3 text-xs bg-slate-855 px-4 py-2 border border-slate-750 rounded-2xl">
              <span className="text-[9px] text-slate-450 block uppercase tracking-wide font-extrabold">Progress Bar</span>
              <span className="font-mono text-slate-205 font-semibold tracking-wider">{getProgressBarText()}</span>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-slate-300">
              <div className="hidden lg:block text-right">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Assessment ID</span>
                <span className="font-mono text-slate-200 font-semibold">{assessmentData?.assessment_id || 'N/A'}</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2.5 bg-slate-855 px-4 py-2 rounded-2xl border border-slate-750 shadow-sm">
              <Clock className={`w-4.5 h-4.5 ${timeLeft < 180 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`} />
              <div className="text-right">
                <span className="text-[9px] text-slate-450 uppercase tracking-widest font-extrabold block">Time Remaining</span>
                <span className={`text-sm font-black font-mono tracking-wider ${timeLeft < 180 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="max-w-7xl w-full mx-auto px-4 mt-6">
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Submission Failed</p>
                <p className="text-xs text-red-750">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Grid Container */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Active Question Column */}
          <div className="w-full lg:flex-grow space-y-6">
            <div 
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
              onCopy={preventCheatEvents}
              onPaste={preventCheatEvents}
              onCut={preventCheatEvents}
              onContextMenu={preventCheatEvents}
            >
              
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-55 border border-indigo-100 text-indigo-700 text-xs font-black px-3 py-1.5 rounded-xl font-display">
                    Question {activeQuestionIndex + 1} of {totalQuestions}
                  </span>
                  
                  {/* Difficulty Badge */}
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getDifficultyStyle(activeQuestion?.difficulty)}`}>
                    {activeQuestion?.difficulty || 'easy'}
                  </span>

                  {/* Flag Question Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleFlag(qId)}
                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1 transition-all ${
                      flagged[qId] 
                        ? 'bg-amber-50 border-amber-250 text-amber-650 font-bold' 
                        : 'bg-slate-50 border-slate-250 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    ★ {flagged[qId] ? 'Starred Flag' : 'Flag Question'}
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-450">
                  {activeQuestion?.marks || 0.5} Marks
                </span>
              </div>

              {/* Question Body */}
              <div className="space-y-5">
                <p className="text-sm font-extrabold text-slate-800 leading-relaxed whitespace-pre-wrap select-none">
                  {activeQuestion?.question}
                </p>

                {/* Input Fields */}
                <div className="pt-2">
                  {activeQuestion?.type === 'mcq' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {getRenderOptions(activeQuestion).map((opt) => {
                        const isSelected = answers[qId] === opt.key
                        return (
                          <label 
                            key={opt.key}
                            className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-50/40 border-indigo-500 text-indigo-950 font-bold shadow-sm shadow-indigo-100/50' 
                                : 'bg-slate-55 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qId}`}
                              value={opt.key}
                              checked={isSelected}
                              onChange={() => setAnswers(prev => ({ ...prev, [qId]: opt.key }))}
                              className="w-4 h-4 text-indigo-650 border-slate-350 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                            />
                            <div className="text-xs leading-normal">
                              <span className="font-extrabold mr-2 text-indigo-655">{opt.key}.</span> {opt.text}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      placeholder="Type your response here..."
                      rows={8}
                      value={answers[qId] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                      onCopy={preventCheatEvents}
                      onPaste={preventCheatEvents}
                      onCut={preventCheatEvents}
                      onContextMenu={preventCheatEvents}
                      className="w-full bg-slate-55 border border-slate-250 rounded-2xl px-4 py-3.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all leading-relaxed placeholder-slate-400"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Nav Controls */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                className="bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 font-bold px-5 py-3 rounded-2xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Question
              </button>
              
              <button
                type="button"
                disabled={activeQuestionIndex === totalQuestions - 1}
                onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                className="bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 font-bold px-5 py-3 rounded-2xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sidebar / Palette Card */}
          <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 font-display">
                  Question Palette
                </h3>
                <p className="text-[10px] text-slate-450 font-medium">Click a number to jump to that question</p>
              </div>

              {/* Grid palette */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const currentQId = q.question_id || q.id
                  const isCurrent = idx === activeQuestionIndex
                  const isAnswered = answers[currentQId] !== undefined && String(answers[currentQId]).trim() !== ""
                  const isStarred = flagged[currentQId]
                  
                  let btnClass = ""
                  if (isCurrent) {
                    btnClass = "bg-indigo-55 border-2 border-indigo-650 text-indigo-700 font-extrabold ring-4 ring-indigo-50"
                  } else if (isAnswered) {
                    btnClass = "bg-indigo-600 border border-indigo-600 text-white font-bold hover:bg-indigo-700"
                  } else {
                    btnClass = "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                  }

                  return (
                    <button
                      key={currentQId}
                      type="button"
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`h-10 rounded-xl text-xs flex items-center justify-center transition-all relative ${btnClass}`}
                    >
                      {idx + 1}
                      {isStarred && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Submit Action */}
              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitAssessment(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'SUBMIT ASSESSMENT'}
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Palette Legend */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Legend</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-indigo-600" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <div className="w-3.5 h-3.5 rounded bg-indigo-55 border-2 border-indigo-600" />
                    <span>Current Question</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <div className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-250 flex items-center justify-center text-[10px] text-amber-650 font-black">★</div>
                    <span>Flagged / Starred Question</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Anti-Cheat / Notification Warning Custom Modal */}
        {antiCheatModal.show && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
            <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 mx-auto flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 font-display">{antiCheatModal.title}</h3>
                <p className="text-xs text-slate-550 leading-relaxed font-medium">{antiCheatModal.message}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseWarningModal}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3 rounded-2xl text-xs transition-all active:scale-[0.98]"
              >
                Acknowledge and Return to Fullscreen
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (flowState === 'SUBMITTING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <Loader2 className="w-12 h-12 text-indigo-650 animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-800 font-display">Submitting Assessment...</h3>
            <p className="text-xs text-slate-450">Packaging your responses and finalizing candidate entry...</p>
          </div>
        </div>
      </div>
    )
  }

  if (flowState === 'SUCCESS') {
    const totalQ = shuffledQuestions.length > 0 ? shuffledQuestions.length : 20
    const answeredCount = Object.keys(answers).length
    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-xl bg-white border border-emerald-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl mx-auto flex items-center justify-center text-emerald-555 shadow-sm">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">Assessment Submitted Successfully</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Thank you. Our AI Interview Evaluation Engine is now evaluating your answers. Please wait for further communication via email.
            </p>
          </div>

          {/* Assessment Detailed Analytics Receipt */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3.5">
            <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2">Submission Details</h4>
            
            <div className="grid grid-cols-2 gap-3.5 text-slate-655">
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Assessment ID</span>
                <span className="font-mono text-slate-800 font-bold">{assessmentData?.assessment_id || 'ASM_UNKNOWN'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Submission Time</span>
                <span className="text-slate-800 font-bold">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Questions Answered</span>
                <span className="text-slate-800 font-bold">{answeredCount} of {totalQ}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Evaluation Status</span>
                <span className="text-indigo-650 font-extrabold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full inline-block">Under AI Evaluation</span>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Estimated Review Time</span>
                <span className="text-slate-800 font-bold">10-15 minutes</span>
              </div>
            </div>
          </div>

          {/* Email Confirmation & Spam/Junk Notice */}
          <div className="bg-indigo-50 border border-indigo-100/80 rounded-2xl p-4 text-left flex items-start space-x-3">
            <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Your assessment has been successfully received by <span className="font-semibold text-indigo-900">hireflow.ai</span>. We will contact you via email shortly. Please monitor your inbox, and remember to check your <span className="font-semibold text-indigo-900">spam/junk folder</span> if you do not receive it.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Return Home
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
