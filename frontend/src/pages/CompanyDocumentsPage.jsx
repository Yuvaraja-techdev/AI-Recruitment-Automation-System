import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  HelpCircle,
  CheckCircle,
} from 'lucide-react'
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  getCompany,
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'
import ErrorState from '../components/ErrorState'
import ConfirmModal from '../components/ConfirmModal'

// Document Categories Mapping
const CATEGORIES = [
  { id: 'POLICY',    label: 'Company Policies',    icon: FolderOpen,      desc: 'Corporate guidelines, handbook, and policy papers.' },
  { id: 'OFFER',     label: 'Offer Templates',     icon: FileText,        desc: 'Standardized candidate employment offer templates.' },
  { id: 'NDA',       label: 'NDA Templates',       icon: FileCode,        desc: 'Non-disclosure agreement forms and privacy templates.' },
  { id: 'GUIDELINE', label: 'Interview Guidelines', icon: HelpCircle,      desc: 'Rubrics, assessment cards, and questionnaire templates.' },
  { id: 'GENERAL',   label: 'Hiring Documents',    icon: FileSpreadsheet, desc: 'Candidate vetting checksheets and general onboarding docs.' },
]

// Helper to format file sizes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Helper to return icons based on file extensions
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['pdf'].includes(ext)) return 'text-red-500 bg-red-50 border-red-100'
  if (['doc', 'docx'].includes(ext)) return 'text-blue-500 bg-blue-50 border-blue-100'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-emerald-500 bg-emerald-50 border-emerald-100'
  if (['zip', 'rar', '7z'].includes(ext)) return 'text-purple-500 bg-purple-50 border-purple-100'
  return 'text-surface-500 bg-surface-50 border-surface-200'
}

const CompanyDocumentsPage = () => {
  const [documents, setDocuments] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState('POLICY')
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [docsData, companyData] = await Promise.all([
        getDocuments(),
        getCompany(),
      ])
      setDocuments(docsData)
      setCompany(companyData)
    } catch (err) {
      setError('Failed to load documents catalog. Please verify connection to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // File Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enforce 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File exceeds 10MB maximum limit.' })
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadDocument(file, activeTab)
      setDocuments((prev) => [...prev, uploaded])
      setToast({ type: 'success', message: `"${file.name}" uploaded successfully!` })
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to upload document.'
      setToast({ type: 'error', message: errMsg })
    } finally {
      setUploading(false)
      // Reset input element
      e.target.value = ''
    }
  }

  // File Download handler
  const handleDownload = async (doc) => {
    try {
      const blob = await downloadDocument(doc.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ type: 'success', message: `Downloading "${doc.filename}"…` })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to download file.' })
    }
  }

  // Delete Document handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await deleteDocument(deleteTarget.id)
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      setToast({ type: 'success', message: `"${deleteTarget.filename}" deleted successfully.` })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete document.' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  // Filter docs for active tab
  const tabDocs = documents.filter((d) => d.doc_type === activeTab)
  const activeCategory = CATEGORIES.find((c) => c.id === activeTab)

  const companyInitials = (company?.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast notifications */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deleteTarget?.filename}"? This file will be permanently removed from disk and workspace access.`}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/recruiter/company"
            className="p-2 rounded-xl hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </Link>
          <div className="flex items-center gap-3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="w-9 h-9 rounded-lg object-cover border border-surface-200 shadow-sm" />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0"
                style={{ backgroundColor: company?.brand_color || '#6366f1' }}
              >
                {companyInitials}
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
                Company Documents
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Central repository for organization-wide policies and hiring documents
              </p>
            </div>
          </div>
        </div>
      </div>

      <CompanySubNav />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-surface-200 bg-white p-2 rounded-2xl shadow-sm border border-surface-100">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const count = documents.filter((d) => d.doc_type === id).length
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold transition-colors ${
                  active ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Grid: Upload box + Document category list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Category Info & Upload Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
                {activeCategory && <activeCategory.icon className="w-5 h-5" />}
              </div>
              <h3 className="text-sm font-bold text-surface-900">{activeCategory?.label}</h3>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">{activeCategory?.desc}</p>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-surface-200 rounded-2xl p-6 text-center hover:border-brand-400 transition-colors relative group">
              <input
                type="file"
                id="doc-upload"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-2">
                <div className="p-3 rounded-full bg-surface-50 w-fit mx-auto text-surface-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-700">
                    {uploading ? 'Uploading Document…' : 'Click to Upload'}
                  </p>
                  <p className="text-[10px] text-surface-400 mt-1">
                    Max size: 10MB (PDF, DOCX, XLSX, ZIP)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Documents List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
            <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                {activeCategory?.label} Files ({tabDocs.length})
              </span>
            </div>

            {tabDocs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <File className="w-10 h-10 text-surface-300 mx-auto" strokeWidth={1.5} />
                <p className="text-sm font-bold text-surface-500">No documents uploaded yet</p>
                <p className="text-xs text-surface-400">
                  Select files on the left panel to upload templates or guidelines under this category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {tabDocs.map((doc) => {
                  const styleCls = getFileIcon(doc.filename)
                  return (
                    <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-surface-50/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File extension indicator */}
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${styleCls}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-surface-900 truncate pr-4" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-surface-400 mt-1">
                            <span>{formatBytes(doc.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* File actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download File"
                          className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          title="Delete File"
                          className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default CompanyDocumentsPage
