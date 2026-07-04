import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import {
  getCandidateById,
  uploadCandidateResume,
  downloadCandidateResume,
  deleteCandidateResume,
  getResumeIntelligence
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function ResumeManagerPage() {
  const navigate = useNavigate()
  const [candidateId, setCandidateId] = useState('')
  const [candidateDetails, setCandidateDetails] = useState(null)
  
  // Loading and alerts
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeIntel, setResumeIntel] = useState(null)
  const [activeTab, setActiveTab] = useState('intel')

  const fetchCandidateData = async () => {
    const userString = localStorage.getItem('user')
    if (!userString) {
      navigate('/login')
      return
    }

    try {
      const user = JSON.parse(userString)
      if (!user.candidate_id) {
        setError('Resume Management is only available for Candidate accounts.')
        setLoading(false)
        return
      }

      setCandidateId(user.candidate_id)
      const data = await getCandidateById(user.candidate_id)
      setCandidateDetails(data)
      
      if (data.resume_filename) {
        try {
          const intel = await getResumeIntelligence(user.candidate_id)
          setResumeIntel(intel)
        } catch (intelErr) {
          console.error("Failed to load resume intelligence:", intelErr)
        }
      }
    } catch (err) {
      setError('Failed to load candidate details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidateData()
  }, [navigate])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setSuccess('')
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setActionLoading(true)
    setUploadProgress(25)
    setError('')
    setSuccess('')

    try {
      setUploadProgress(60)
      await uploadCandidateResume(candidateId, selectedFile)
      setUploadProgress(100)
      setSuccess('Resume successfully uploaded!')
      setSelectedFile(null)
      // Refresh candidate data to show changes
      const updatedData = await getCandidateById(candidateId)
      setCandidateDetails(updatedData)
      
      if (updatedData.resume_filename) {
        const intel = await getResumeIntelligence(candidateId)
        setResumeIntel(intel)
      }
    } catch (err) {
      setError('Failed to upload and parse resume file.')
      setUploadProgress(0)
    } finally {
      setActionLoading(false)
      setTimeout(() => setUploadProgress(0), 1500)
    }
  }

  const handleDownload = async () => {
    if (!candidateDetails?.resume_filename) return
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const blob = await downloadCandidateResume(candidateId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', candidateDetails.resume_filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      setSuccess('Download triggered successfully!')
    } catch (err) {
      setError('Failed to download resume file.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your resume from the server? This action cannot be undone.')) {
      return
    }
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await deleteCandidateResume(candidateId)
      setSuccess('Resume successfully deleted.')
      const updatedData = await getCandidateById(candidateId)
      setCandidateDetails(updatedData)
      setResumeIntel(null)
    } catch (err) {
      setError('Failed to delete resume file.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
            ID: {candidateId || '...'}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        {loading ? (
          <LoadingSkeleton type="details" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display">
                  Resume File Manager
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Upload, preview, replace, download, or delete your professional CV document.
                </p>
              </div>
            </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left panel: File Action controls */}
          <div className="space-y-6 md:col-span-1">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1">
                <FolderOpen className="w-4 h-4 text-brand-500" />
                Active File
              </h3>

              {candidateDetails?.resume_filename ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <FileText className="w-8 h-8 text-brand-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {candidateDetails.resume_filename}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Physical File Saved
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={actionLoading}
                      className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Resume
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-250 rounded-xl bg-slate-50/50 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-550 font-bold">No resume uploaded</p>
                  <p className="text-[10px] text-slate-400 px-3">
                    Upload a file below to complete your profile structure.
                  </p>
                </div>
              )}
            </div>

            {/* Replace / Upload Widget */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                {candidateDetails?.resume_filename ? 'Replace Resume' : 'Upload Resume'}
              </h3>

              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-manager-file-picker"
                />
                
                <label
                  htmlFor="resume-manager-file-picker"
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border-dashed"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span>Choose PDF, DOCX, or TXT</span>
                </label>

                {selectedFile && (
                  <div className="space-y-3 animate-scale-up">
                    <p className="text-[11px] text-slate-550 truncate font-semibold">
                      Selected: {selectedFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={actionLoading}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        'Submit Upload'
                      )}
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-brand-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Tabbed ATS Intelligence and Preview board */}
          <div className="md:col-span-2">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-5 h-full flex flex-col min-h-[420px]">
              
              {/* Tab selectors header */}
              <div className="flex border-b border-slate-100 text-xs font-bold text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveTab('intel')}
                  className={`pb-2.5 px-4 transition-all border-b-2 ${
                    activeTab === 'intel'
                      ? 'border-brand-500 text-brand-655 font-extrabold'
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  ATS Resume Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`pb-2.5 px-4 transition-all border-b-2 ${
                    activeTab === 'raw'
                      ? 'border-b-2 border-brand-500 text-brand-655 font-extrabold'
                      : 'border-transparent hover:text-slate-700'
                  }`}
                >
                  Raw Parsed Text
                </button>
              </div>

              {candidateDetails?.resume ? (
                <div className="flex-grow flex flex-col">
                  {activeTab === 'intel' ? (
                    resumeIntel ? (
                      <div className="space-y-5 overflow-y-auto pr-1 max-h-[450px] scrollbar-thin text-left">
                        {/* Extracted Contacts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs font-semibold text-slate-700">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wide block">Email Address</span>
                            <span className="truncate block font-mono select-all text-slate-800">{resumeIntel.email || 'N/A'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wide block">Contact Phone</span>
                            <span className="truncate block font-mono select-all text-slate-800">{resumeIntel.phone || 'N/A'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wide block">Extracted Location</span>
                            <span className="truncate block text-slate-800">{resumeIntel.location || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Suggested target careers */}
                        {resumeIntel.target_roles && resumeIntel.target_roles.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">Suggested Career Roles</span>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeIntel.target_roles.map((role, idx) => (
                                <span key={idx} className="px-3 py-1 bg-brand-50 text-brand-700 border border-brand-100 rounded-lg font-bold text-[11px] uppercase tracking-wide">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills comparison grid */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">ATS Keywords Check</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 bg-emerald-50/20 border border-emerald-150 rounded-xl p-3.5">
                              <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wide block">Extracted Skills</span>
                              <div className="flex flex-wrap gap-1">
                                {resumeIntel.extracted_skills?.map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold">
                                    {s}
                                  </span>
                                ))}
                                {(!resumeIntel.extracted_skills || resumeIntel.extracted_skills.length === 0) && (
                                  <span className="text-[10px] text-emerald-600/75 italic">None detected</span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 bg-indigo-50/20 border border-indigo-150 rounded-xl p-3.5">
                              <span className="text-[9px] text-indigo-700 font-extrabold uppercase tracking-wide block">Missing Recommendations</span>
                              <div className="flex flex-wrap gap-1">
                                {resumeIntel.recommended_skills?.map((s, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100 text-[10px] font-bold">
                                    + {s}
                                  </span>
                                ))}
                                {(!resumeIntel.recommended_skills || resumeIntel.recommended_skills.length === 0) && (
                                  <span className="text-[10px] text-indigo-650/75 italic">Fully optimized!</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Optimization tips feedback */}
                        {resumeIntel.feedback && resumeIntel.feedback.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">ATS Optimization Feedback</span>
                            <div className="space-y-2">
                              {resumeIntel.feedback.map((tip, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5 leading-relaxed font-semibold">
                                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                                  <span>{tip}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 p-8">
                        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mb-2" />
                        <p className="text-xs font-bold text-slate-550">Processing ATS Resume Intelligence...</p>
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-grow overflow-y-auto max-h-[420px] scrollbar-thin text-left">
                      <p className="text-[11px] text-slate-655 leading-relaxed whitespace-pre-wrap font-mono select-all">
                        {candidateDetails.resume}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 p-8">
                  <FileText className="w-12 h-12 text-slate-200" />
                  <p className="text-xs font-bold text-slate-550 mt-3">No parsed resume context found</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                    Once a PDF, Word, or text file is uploaded, the ATS parser intelligence and text blocks will render here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
          </>
        )}
      </main>

    </div>
  )
}

export default ResumeManagerPage
