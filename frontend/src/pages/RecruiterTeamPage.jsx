import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Edit2,
  X,
  UserCheck,
} from 'lucide-react'
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  getCompany,
} from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import CompanySubNav from '../components/CompanySubNav'
import ConfirmModal from '../components/ConfirmModal'

// Helper to generate a consistent color based on user name
const getAvatarColor = (name) => {
  const colors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-sky-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-800 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-surface-300'

const RecruiterTeamPage = () => {
  const [members, setMembers] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modals / Dialogs state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  // Loading indicator states
  const [inviting, setInviting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'RECRUITER' })
  const [editRole, setEditRole] = useState('RECRUITER')
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
      const [membersData, companyData] = await Promise.all([
        getTeamMembers(),
        getCompany(),
      ])
      setMembers(membersData)
      setCompany(companyData)
    } catch (err) {
      setError('Failed to load team workspace. Please verify connection to the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle Invite Form Changes
  const handleInviteChange = (e) => {
    const { name, value } = e.target
    setInviteForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit Invite
  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      setToast({ type: 'error', message: 'Name and email are required.' })
      return
    }

    setInviting(true)
    try {
      const newMember = await inviteTeamMember({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        role: inviteForm.role,
      })
      setMembers((prev) => [...prev, newMember])
      setToast({ type: 'success', message: `Invitation successfully sent to ${newMember.name}!` })
      setInviteOpen(false)
      setInviteForm({ name: '', email: '', role: 'RECRUITER' })
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to send invite. Please try again.'
      setToast({ type: 'error', message: errMsg })
    } finally {
      setInviting(false)
    }
  }

  // Open Edit Role modal
  const handleOpenEdit = (member) => {
    setEditTarget(member)
    setEditRole(member.role)
    setEditOpen(true)
  }

  // Save Role Update
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editTarget) return

    setUpdating(true)
    try {
      const updated = await updateTeamMemberRole(editTarget.id, editRole)
      setMembers((prev) =>
        prev.map((m) => (m.id === editTarget.id ? { ...m, role: updated.role } : m))
      )
      setToast({ type: 'success', message: `${editTarget.name}'s role updated to ${updated.role}!` })
      setEditOpen(false)
      setEditTarget(null)
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to update role.'
      setToast({ type: 'error', message: errMsg })
    } finally {
      setUpdating(false)
    }
  }

  // Remove Team Member
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await removeTeamMember(deleteTarget.id)
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      setToast({ type: 'success', message: `${deleteTarget.name} removed from the team.` })
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to remove team member.'
      setToast({ type: 'error', message: errMsg })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  const companyInitials = (company?.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Toast Feedback */}
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

      {/* Delete Member Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Team Member"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from your recruitment team? They will immediately lose workspace credentials and system access.`}
        confirmText={deleting ? 'Removing…' : 'Remove Member'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Invite Member Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-surface-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold font-display text-surface-900">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setInviteOpen(false)}
                className="p-1 rounded-lg text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-600 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={inviteForm.name}
                  onChange={handleInviteChange}
                  placeholder="e.g. Jane Doe"
                  className={inputCls}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-600 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={inviteForm.email}
                  onChange={handleInviteChange}
                  placeholder="jane.doe@company.com"
                  className={inputCls}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-600 uppercase tracking-wider block">Role Assignment</label>
                <select
                  name="role"
                  value={inviteForm.role}
                  onChange={handleInviteChange}
                  className={inputCls}
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl border border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {inviting ? 'Inviting…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-surface-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold font-display text-surface-900">Change Team Role</h3>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 rounded-lg text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="p-3 bg-surface-50 rounded-xl border border-surface-100 space-y-1">
                <p className="text-xs font-bold text-surface-700">{editTarget.name}</p>
                <p className="text-xs text-surface-500">{editTarget.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-600 uppercase tracking-wider block">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className={inputCls}
                >
                  <option value="RECRUITER">Recruiter</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={updating}
                  className="px-4 py-2 rounded-xl border border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {updating ? 'Saving…' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Team Management
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Manage your organization recruiters and workspace permissions
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-600/20 group"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <CompanySubNav />

      {/* Grid count summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Total Members</p>
            <p className="text-2xl font-bold font-display text-surface-900">{members.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Administrators</p>
            <p className="text-2xl font-bold font-display text-surface-900">
              {members.filter((m) => m.role === 'ADMIN').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-surface-400">Recruiters</p>
            <p className="text-2xl font-bold font-display text-surface-900">
              {members.filter((m) => m.role === 'RECRUITER').length}
            </p>
          </div>
        </div>
      </div>

      {/* Team table list */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-surface-400">
                    No team members found. Invite some to get started.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const initialName = member.name || 'Member'
                  const initials = initialName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  
                  return (
                    <tr key={member.id} className="hover:bg-surface-50/50 transition-colors">
                      {/* Avatar & Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-sm ${getAvatarColor(initialName)}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-surface-900 leading-none">{member.name}</p>
                            <p className="text-xs text-surface-400 mt-1 uppercase tracking-wider font-semibold">
                              ID: {member.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-surface-400" />
                          {member.email}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                            <Shield className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                            <Users className="w-3 h-3" /> Recruiter
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                          Active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            title="Edit Role"
                            className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setDeleteTarget(member)}
                            title="Remove Member"
                            className="p-2 rounded-xl bg-surface-50 border border-surface-200 text-surface-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RecruiterTeamPage
