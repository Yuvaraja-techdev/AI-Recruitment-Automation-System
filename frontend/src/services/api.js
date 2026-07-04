import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token into headers if present in localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ──────────────────────────────────────────────
// Authentication Endpoints
// ──────────────────────────────────────────────

/** Sign up candidate user */
export const signup = async (name, email, password) => {
  const response = await API.post('/auth/signup', { name, email, password })
  if (response.data?.access_token) {
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

/** Log in user */
export const login = async (email, password, role) => {
  const response = await API.post('/auth/login', { email, password, role })
  if (response.data?.access_token) {
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

/** Trigger password reset link request */
export const forgotPassword = async (email) => {
  const response = await API.post('/auth/forgot-password', { email })
  return response.data
}

/** Fetch current user context */
export const getCurrentUser = async () => {
  const response = await API.get('/auth/me')
  return response.data
}

/** Log out and purge cache tokens */
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}


// ──────────────────────────────────────────────
// Candidate Endpoints
// ──────────────────────────────────────────────

/** Fetch all candidates */
export const getAllCandidates = async () => {
  const response = await API.get('/candidates/')
  return response.data
}

/** Fetch a single candidate by ID */
export const getCandidateById = async (candidateId) => {
  const response = await API.get(`/candidates/${candidateId}`)
  return response.data
}

/** Create a new candidate */
export const createCandidate = async (candidateData) => {
  const response = await API.post('/candidates/', candidateData)
  return response.data
}

/** Update candidate status */
export const updateCandidateStatus = async (candidateId, status) => {
  const response = await API.put(`/candidates/${candidateId}/status`, { status })
  return response.data
}

/** Get AI-generated pre-interview resume context */
export const getCandidateResumeContext = async (candidateId) => {
  const response = await API.get(`/candidates/${candidateId}/resume-context`)
  return response.data
}

/** Generate personalized interview questions */
export const generateCandidateQuestions = async (candidateId, jobDescription = null) => {
  const response = await API.post(`/candidates/${candidateId}/generate-questions`, { job_description: jobDescription })
  return response.data
}

/** Delete a candidate */
export const deleteCandidate = async (candidateId) => {
  const response = await API.delete(`/candidates/${candidateId}`)
  return response.data
}

/** Start interview session */
export const startInterview = async (name, role, resume, candidateId = null) => {
  const response = await API.post('/start-interview', { candidate_name: name, role, resume, candidate_id: candidateId })
  return response.data
}


/** Transcribe voice audio */
export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  const response = await API.post('/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/** Evaluate candidate response */
export const evaluateAnswer = async (question, answer, role, resume, sessionId) => {
  const response = await API.post('/evaluate-answer', {
    question,
    answer,
    role,
    resume,
    session_id: sessionId,
  })
  return response.data
}

/** Fetch next question */
export const nextQuestion = async (sessionId) => {
  const response = await API.post('/next-question', { session_id: sessionId })
  return response.data
}

/** Conclude interview and compile review summary */
export const endInterview = async (sessionId) => {
  const response = await API.post('/end-interview', { session_id: sessionId })
  return response.data
}

/** Update candidate profile information */
export const updateCandidateProfile = async (candidateId, profileData) => {
  const response = await API.put(`/candidates/${candidateId}/profile`, profileData)
  return response.data
}

/** Upload candidate resume file */
export const uploadCandidateResume = async (candidateId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await API.post(`/candidates/${candidateId}/resume`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/** Fetch all open job listings based on filters */
export const getAllJobs = async (params = {}) => {
  const response = await API.get('/jobs/', { params })
  return response.data
}

/** Fetch dynamic AI recommendations for the candidate */
export const getJobRecommendations = async () => {
  const response = await API.get('/jobs/recommendations')
  return response.data
}


/** Fetch details of a specific job by ID */
export const getJobById = async (jobId) => {
  const response = await API.get(`/jobs/${jobId}`)
  return response.data
}

/** Create a new job listing */
export const createJob = async (jobData) => {
  const response = await API.post('/jobs/', jobData)
  return response.data
}

/** Update an existing job listing */
export const updateJob = async (jobId, jobData) => {
  const response = await API.put(`/jobs/${jobId}`, jobData)
  return response.data
}

/** Delete a job listing */
export const deleteJob = async (jobId) => {
  const response = await API.delete(`/jobs/${jobId}`)
  return response.data
}

/** Submit job application */
export const applyForJob = async (jobId) => {
  const response = await API.post('/applications/', { job_id: jobId })
  return response.data
}

/** Fetch user applications */
export const getMyApplications = async () => {
  const response = await API.get('/applications/')
  return response.data
}

/** Fetch details of a specific application by ID */
export const getApplicationById = async (appId) => {
  const response = await API.get(`/applications/${appId}`)
  return response.data
}

/** Download physical resume file */
export const downloadCandidateResume = async (candidateId) => {
  const response = await API.get(`/candidates/${candidateId}/resume/download`, {
    responseType: 'blob',
  })
  return response.data
}

/** Delete resume file and data */
export const deleteCandidateResume = async (candidateId) => {
  const response = await API.delete(`/candidates/${candidateId}/resume`)
  return response.data
}

/** Fetch resume upload history */
export const getResumeHistory = async (candidateId) => {
  const response = await API.get(`/candidates/${candidateId}/resume-history`)
  return response.data
}

/** Fetch parsed resume intelligence details */
export const getResumeIntelligence = async (candidateId) => {
  const response = await API.get(`/candidates/${candidateId}/resume-intelligence`)
  return response.data
}



/** Fetch all interview time slots */
export const getInterviewSlots = async () => {
  const response = await API.get('/scheduler/slots')
  return response.data
}

/** Book a specific interview time slot */
export const bookInterviewSlot = async (slotId) => {
  const response = await API.post(`/scheduler/slots/${slotId}/book`)
  return response.data
}

/** Cancel active interview slot booking */
export const cancelInterviewSlot = async () => {
  const response = await API.post('/scheduler/slots/cancel')
  return response.data
}

/** Assign a specific interview time slot manually (Recruiter) */
export const assignInterviewSlot = async (slotId, candidateId) => {
  const response = await API.post(`/scheduler/slots/${slotId}/assign/${candidateId}`)
  return response.data
}

/** Release manual interview slot booking (Recruiter) */
export const releaseInterviewSlot = async (candidateId) => {
  const response = await API.delete(`/scheduler/slots/release/${candidateId}`)
  return response.data
}


// ──────────────────────────────────────────────
// Company Endpoints
// ──────────────────────────────────────────────

/** Fetch company profile (auto-creates default if absent) */
export const getCompany = async () => {
  const response = await API.get('/company/')
  return response.data
}

/** Create company profile */
export const createCompany = async (data) => {
  const response = await API.post('/company/', data)
  return response.data
}

/** Update company profile */
export const updateCompany = async (companyId, data) => {
  const response = await API.put(`/company/${companyId}`, data)
  return response.data
}

/** Fetch live company hiring statistics */
export const getCompanyStats = async () => {
  const response = await API.get('/company/stats')
  return response.data
}

/** Fetch company AI metrics and reports */
export const getCompanyAiMetrics = async () => {
  const response = await API.get('/company/ai-metrics')
  return response.data
}

// ──────────────────────────────────────────────
// Team Endpoints
// ──────────────────────────────────────────────

/** Fetch all team members (RECRUITER + ADMIN users) */
export const getTeamMembers = async () => {
  const response = await API.get('/team/')
  return response.data
}

/** Invite a new team member (creates user account) */
export const inviteTeamMember = async (data) => {
  const response = await API.post('/team/invite', data)
  return response.data
}

/** Update a team member's role */
export const updateTeamMemberRole = async (userId, role) => {
  const response = await API.put(`/team/${userId}/role`, { role })
  return response.data
}

/** Remove a team member */
export const removeTeamMember = async (userId) => {
  const response = await API.delete(`/team/${userId}`)
  return response.data
}


// ──────────────────────────────────────────────
// Document Endpoints
// ──────────────────────────────────────────────

/** Fetch all company documents metadata */
export const getDocuments = async () => {
  const response = await API.get('/documents/')
  return response.data
}

/** Upload a company document */
export const uploadDocument = async (file, docType) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doc_type', docType)
  const response = await API.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/** Download document by database record ID */
export const downloadDocument = async (docId) => {
  const response = await API.get(`/documents/${docId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

/** Delete document by ID */
export const deleteDocument = async (docId) => {
  const response = await API.delete(`/documents/${docId}`)
  return response.data
}


// ──────────────────────────────────────────────
// Saved Jobs Endpoints
// ──────────────────────────────────────────────

/** Fetch all bookmarked jobs for candidate */
export const getSavedJobs = async () => {
  const response = await API.get('/saved-jobs/')
  return response.data
}

/** Bookmark a job */
export const saveJob = async (jobId) => {
  const response = await API.post(`/saved-jobs/${jobId}`)
  return response.data
}

/** Remove job bookmark */
export const unsaveJob = async (jobId) => {
  const response = await API.delete(`/saved-jobs/${jobId}`)
  return response.data
}

export default API




