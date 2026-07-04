import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Users,
  Eye,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  XCircle,
  Check,
  RefreshCw,
  Cpu,
  UserCheck,
  UserX,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateCandidateStatus } from '../services/api'
import useCandidates from '../hooks/useCandidates'
import useSort from '../hooks/useSort'
import useDebounce from '../hooks/useDebounce'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import ConfirmModal from '../components/ConfirmModal'

const CandidatesPage = () => {
  const { candidates, loading, error, stats: initialStats, refetch, removeCandidate } = useCandidates()
  const [searchParams] = useSearchParams()

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Action / deletion states
  const [deleteCandidateData, setDeleteCandidateData] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [toast, setToast] = useState(null)

  // Sync search state with query param
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [searchParams])

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const debouncedSearch = useDebounce(searchQuery, 300)

  if (loading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  // Calculate the 7 requested metrics cards
  const totalCount = candidates.length
  const pendingCount = candidates.filter((c) => c.status?.toUpperCase() === 'PENDING').length
  const screenedCount = candidates.filter((c) => c.status?.toUpperCase() === 'SCREENED').length
  const scheduledCount = candidates.filter((c) => ['INTERVIEWING', 'INTERVIEW_SCHEDULED'].includes(c.status?.toUpperCase())).length
  const completedCount = candidates.filter((c) => ['COMPLETED', 'INTERVIEW_COMPLETED'].includes(c.status?.toUpperCase())).length
  const selectedCount = candidates.filter((c) => c.status?.toUpperCase() === 'SELECTED').length
  const rejectedCount = candidates.filter((c) => c.status?.toUpperCase() === 'REJECTED').length

  // Filter candidates list
  const statusFiltered = (candidates || []).filter((c) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'INTERVIEWING') {
      return ['INTERVIEWING', 'INTERVIEW_SCHEDULED'].includes(c.status?.toUpperCase())
    }
    if (statusFilter === 'COMPLETED') {
      return ['COMPLETED', 'INTERVIEW_COMPLETED'].includes(c.status?.toUpperCase())
    }
    return c.status?.toUpperCase() === statusFilter
  })

  const searchFiltered = statusFiltered.filter((c) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return (
      String(c.candidate_id || '').toLowerCase().includes(q) ||
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.email || '').toLowerCase().includes(q) ||
      String(c.applied_role || '').toLowerCase().includes(q)
    )
  })

  // Sort
  const { sortedData, sortConfig, requestSort } = useSort(searchFiltered)

  // Paginate
  const totalItems = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Deletion logic
  const handleDeleteRequest = (candidate) => {
    setDeleteCandidateData(candidate)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCandidateData) return
    setDeleting(true)
    const targetId = deleteCandidateData.candidate_id
    const targetName = deleteCandidateData.name

    try {
      await removeCandidate(targetId)
      setToast({
        message: `Successfully deleted candidate ${targetName}`,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: err.message || `Failed to delete candidate ${targetName}`,
        type: 'error',
      })
    } finally {
      setDeleting(false)
      setDeleteCandidateData(null)
    }
  }

  // Update applicant status operation
  const handleStatusUpdate = async (candidateId, newStatus) => {
    setActionLoadingId(candidateId)
    try {
      await updateCandidateStatus(candidateId, newStatus)
      setToast({
        message: `Status set to ${newStatus} successfully!`,
        type: 'success',
      })
      refetch()
    } catch (err) {
      setToast({
        message: err.response?.data?.detail || 'Failed to update candidate status.',
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const getAiRecommendation = (atsScore) => {
    if (!atsScore) return 'Needs Screening'
    if (atsScore >= 85) return 'Highly Recommended'
    if (atsScore >= 70) return 'Recommended'
    return 'Not Recommended'
  }

  // Columns definition
  const columns = [
    {
      key: 'name',
      label: 'Candidate Details',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.profile_photo ? (
            <img
              src={`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'}/static/${row.profile_photo}`}
              alt={row.name}
              className="w-8 h-8 rounded-full object-cover border border-surface-200"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = ''
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
              {row.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-surface-850 block">{row.name}</span>
            <span className="text-[10px] text-surface-450 block font-mono">{row.candidate_id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => <span className="text-xs text-surface-500 font-medium">{row.email}</span>,
    },
    {
      key: 'applied_role',
      label: 'Applied Job',
      sortable: true,
      render: (row) => <span className="text-xs text-surface-650 font-semibold">{row.applied_role}</span>,
    },
    {
      key: 'ats_score',
      label: 'ATS Score',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-extrabold text-brand-650 bg-brand-50 px-2 py-0.5 rounded-lg text-xs">
          {row.ats_score || 80}%
        </span>
      ),
    },
    {
      key: 'recommendation',
      label: 'AI recommendation',
      sortable: false,
      render: (row) => {
        const rec = getAiRecommendation(row.ats_score)
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
              rec === 'Highly Recommended'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : rec === 'Recommended'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3" /> {rec}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Quick actions',
      align: 'right',
      sortable: false,
      render: (row) => {
        const isActionLoading = actionLoadingId === row.candidate_id
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Link
              to={`/recruiter/candidates/${row.candidate_id}`}
              className="p-1.5 rounded-lg text-surface-450 hover:bg-surface-150 hover:text-surface-700 transition-colors"
              title="View Profile Details"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
                window.open(`${apiBase}/candidates/${row.candidate_id}/resume/download`, '_blank');
              }}
              className="p-1.5 rounded-lg text-surface-450 hover:bg-surface-150 hover:text-surface-700 transition-colors"
              title="View/Download Resume File"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Change Status controls */}
            {row.status?.toUpperCase() !== 'INTERVIEWING' && (
              <button
                onClick={() => handleStatusUpdate(row.candidate_id, 'INTERVIEWING')}
                disabled={isActionLoading}
                className="p-1 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 transition-colors"
                title="Schedule AI Voice Interview"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            )}

            {row.status?.toUpperCase() !== 'SELECTED' && (
              <button
                onClick={() => handleStatusUpdate(row.candidate_id, 'SELECTED')}
                disabled={isActionLoading}
                className="p-1 rounded-lg border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                title="Shortlist & Accept"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}

            {row.status?.toUpperCase() !== 'REJECTED' && (
              <button
                onClick={() => handleStatusUpdate(row.candidate_id, 'REJECTED')}
                disabled={isActionLoading}
                className="p-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 transition-colors"
                title="Reject Candidate"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {isActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-surface-400" />}

            <button
              onClick={() => handleDeleteRequest(row)}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete candidate completely"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )
      },
    },
  ]

  const emptyMessage =
    searchQuery || statusFilter !== 'ALL' ? 'No candidates match your search filters' : 'No candidates found'

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
          Applicants Directory
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          Review screening scores, schedule audio interviews, and shortlist matching candidates
        </p>
      </div>

      {/* Grid of 7 status widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatWidget label="Total Applicants" value={totalCount} bg="bg-brand-50" text="text-brand-700" border="border-brand-100" />
        <StatWidget label="Pending Review" value={pendingCount} bg="bg-amber-50/50" text="text-amber-700" border="border-amber-100" />
        <StatWidget label="AI Screened" value={screenedCount} bg="bg-indigo-50/60" text="text-indigo-700" border="border-indigo-150" />
        <StatWidget label="Interview Scheduled" value={scheduledCount} bg="bg-purple-50" text="text-purple-700" border="border-purple-150" />
        <StatWidget label="Interview Completed" value={completedCount} bg="bg-sky-50" text="text-sky-700" border="border-sky-150" />
        <StatWidget label="Selected" value={selectedCount} bg="bg-emerald-50" text="text-emerald-700" border="border-emerald-150" />
        <StatWidget label="Rejected" value={rejectedCount} bg="bg-red-50" text="text-red-700" border="border-red-150" />
      </div>

      {/* Search and Filters panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-surface-150 rounded-2xl p-4 shadow-card">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 placeholder:text-surface-450 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
          />
        </div>

        {/* Filters tab selectors */}
        <div className="flex bg-surface-100 rounded-lg p-0.5 text-[10px] font-bold w-full sm:w-auto overflow-x-auto">
          {[
            { value: 'ALL', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'SCREENED', label: 'Screened' },
            { value: 'INTERVIEWING', label: 'Scheduled' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'SELECTED', label: 'Selected' },
            { value: 'REJECTED', label: 'Rejected' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                statusFilter === opt.value
                  ? 'bg-white text-surface-850 shadow-sm'
                  : 'text-surface-450 hover:text-surface-650'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-surface-150">
        <DataTable
          columns={columns}
          data={paginatedData}
          sortConfig={sortConfig}
          onSort={requestSort}
          emptyMessage={emptyMessage}
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Confirmation modal for delete */}
      <ConfirmModal
        isOpen={!!deleteCandidateData}
        onClose={() => setDeleteCandidateData(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to permanently delete applicant "${deleteCandidateData?.name}"? All associated evaluation logs and resume intelligence files will be purged. This action cannot be undone.`}
        confirmText="Confirm Delete"
        loading={deleting}
      />

      {/* Toast alarms */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold max-w-sm w-full sm:w-auto ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                : 'bg-red-50 text-red-800 border-red-250'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper Widget
const StatWidget = ({ label, value, bg, text, border }) => (
  <div className={`bg-white border rounded-2xl p-4 shadow-card flex flex-col justify-between ${border}`}>
    <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">{label}</span>
    <span className={`text-xl font-black font-display mt-2 block ${text}`}>{value}</span>
  </div>
)

export default CandidatesPage
