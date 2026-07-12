import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  IndianRupee,
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle,
  FileText,
  BadgeAlert,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getJobById, createJob, updateJob } from '../services/api'
import Breadcrumb from '../components/Breadcrumb'

function JobFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  // State definitions
  const [formData, setFormData] = useState({
    title: '',
    company: 'HireFlow Tech',
    location: '',
    type: 'Full-time',
    experience: 'Mid-Senior',
    mode: 'Hybrid',
    salary: '',
    description: '',
    requirements: '',
    skills: [],
    status: 'Published', // 'Published' | 'Draft' | 'Closed'
    is_active: true, // System state
  })

  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  // Toast Auto Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Load existing job details if in Edit Mode
  useEffect(() => {
    const fetchJob = async () => {
      setFetching(true)
      try {
        const targetJob = await getJobById(id)
        if (targetJob) {
          setFormData({
            title: targetJob.title || '',
            company: targetJob.company || 'HireFlow Tech',
            location: targetJob.location || '',
            type: targetJob.employment_type || targetJob.type || 'Full-time',
            experience: targetJob.experience || 'Mid-Senior',
            mode: targetJob.work_mode || jobModeFromLocation(targetJob.location) || 'Hybrid',
            salary: targetJob.salary || '',
            description: targetJob.description || '',
            requirements: targetJob.requirements || '',
            skills: Array.isArray(targetJob.skills) ? targetJob.skills : [],
            status: targetJob.status || 'Published',
            is_active: targetJob.is_active !== false,
          })
        } else {
          setError('Requested job posting was not found.')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load job configuration details from backend.')
      } finally {
        setFetching(false)
      }
    }

    if (isEditMode) {
      fetchJob()
    }
  }, [id, isEditMode])

  // Helper to extract work mode from location text
  const jobModeFromLocation = (loc) => {
    if (!loc) return 'Hybrid'
    if (loc.toLowerCase().includes('remote')) return 'Remote'
    if (loc.toLowerCase().includes('on-site') || loc.toLowerCase().includes('onsite')) return 'On-site'
    return 'Hybrid'
  }

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const insertFormat = (fieldName, formatType) => {
    const textarea = document.getElementsByName(fieldName)[0]
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData[fieldName]
    const selectedText = text.substring(start, end)
    
    let replacement = ''
    switch (formatType) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`
        break
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`
        break
      case 'bullet':
        replacement = `\n- ${selectedText || 'list item'}`
        break
      case 'number':
        replacement = `\n1. ${selectedText || 'list item'}`
        break
      case 'header':
        replacement = `\n### ${selectedText || 'Heading'}`
        break
      default:
        return
    }
    
    const newText = text.substring(0, start) + replacement + text.substring(end)
    setFormData((prev) => ({ ...prev, [fieldName]: newText }))
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  const renderEditorToolbar = (fieldName) => (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-b-0 border-surface-200 rounded-t-xl px-3 py-1.5 text-xs text-surface-500 font-semibold select-none">
      <button
        type="button"
        onClick={() => insertFormat(fieldName, 'bold')}
        className="px-2 py-1 hover:bg-surface-200/80 rounded font-extrabold text-[10px] text-surface-700 bg-white shadow-sm border border-surface-150 transition-colors"
        title="Bold text"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => insertFormat(fieldName, 'italic')}
        className="px-2 py-1 hover:bg-surface-200/80 rounded italic text-[10px] text-surface-700 bg-white shadow-sm border border-surface-150 transition-colors"
        title="Italic text"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => insertFormat(fieldName, 'header')}
        className="px-2 py-1 hover:bg-surface-200/80 rounded font-bold text-[9px] text-surface-700 bg-white shadow-sm border border-surface-150 transition-colors font-mono"
        title="Heading"
      >
        H3
      </button>
      <div className="w-px h-3.5 bg-surface-200 mx-0.5" />
      <button
        type="button"
        onClick={() => insertFormat(fieldName, 'bullet')}
        className="px-2 py-1 hover:bg-surface-200/80 rounded text-[9px] text-surface-700 bg-white shadow-sm border border-surface-150 transition-colors"
        title="Bullet List"
      >
        • Bullet List
      </button>
      <button
        type="button"
        onClick={() => insertFormat(fieldName, 'number')}
        className="px-2 py-1 hover:bg-surface-200/80 rounded text-[9px] text-surface-700 bg-white shadow-sm border border-surface-150 transition-colors"
        title="Numbered List"
      >
        1. Number List
      </button>
    </div>
  )

  // Handle Skill Tag Adding
  const handleAddSkill = (e) => {
    e.preventDefault()
    const cleanInput = skillInput.trim()
    if (cleanInput && !formData.skills.includes(cleanInput)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, cleanInput],
      }))
      setSkillInput('')
    }
  }

  // Handle Skill Tag Removing
  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }))
  }

  // Form Submit Handler connecting to backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formattedLocation = formatLocationWithMode(formData.location, formData.mode)
    const payload = {
      title: formData.title,
      company: formData.company,
      location: formattedLocation,
      experience: formData.experience,
      salary: formData.salary,
      description: formData.description,
      requirements: formData.requirements,
      skills: formData.skills,
      is_active: formData.is_active !== false,
      employment_type: formData.type,
      work_mode: formData.mode,
      status: formData.status,
    }

    try {
      if (isEditMode) {
        await updateJob(id, payload)
        setToast({ message: 'Job posting updated successfully!', type: 'success' })
      } else {
        await createJob(payload)
        setToast({ message: 'New job posting created successfully!', type: 'success' })
      }

      // Redirect back to job management table page
      setTimeout(() => {
        navigate('/recruiter/jobs')
      }, 1000)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to persist job parameters to backend.')
      setLoading(false)
    }
  }

  // Helper to format location text with mode tag
  const formatLocationWithMode = (loc, mode) => {
    const base = loc.replace(/\s*\((Remote|Hybrid|On-site|Onsite)\)/gi, '').trim()
    return `${base} (${mode})`
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Jobs', path: '/recruiter/jobs' },
    { label: isEditMode ? 'Edit Posting' : 'New Posting' },
  ]

  if (fetching) {
    return <div className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-16">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center gap-3">
          <BadgeAlert className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content Card */}
      <div className="bg-white rounded-2xl border border-surface-150 shadow-card overflow-hidden">
        {/* Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-brand-500 to-indigo-650" />

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1 pb-4 border-b border-surface-100">
              <h2 className="text-lg font-bold font-display text-surface-900">
                {isEditMode ? 'Modify Job Posting' : 'Create Job Posting'}
              </h2>
              <p className="text-xs text-surface-450">
                Provide role parameters, skills checklist, and status visibility configurations.
              </p>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Job Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Job Position Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Senior Backend Architect (Node/Go)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Hiring Entity / Company
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. HireFlow Tech"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                />
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Salary range or budget
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                  <input
                    type="text"
                    name="salary"
                    required
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. ₹8 - ₹12 LPA"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Base Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                  />
                </div>
              </div>

              {/* Work Mode */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Work Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Employment type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Experience level target
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                >
                  <option value="Entry">Entry (0-2 years)</option>
                  <option value="Mid">Mid (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                  <option value="Lead / Principal">Lead / Principal (8+ years)</option>
                </select>
              </div>

              {/* Required Skills input */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Required Skill Checklist
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a required skill (e.g. React, PostgreSQL, FastAPI)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-xs text-surface-700 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1 border border-brand-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Skill Chips List */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {formData.skills.length === 0 ? (
                    <span className="text-[10px] text-surface-400 italic">No skills added yet.</span>
                  ) : (
                    formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-brand-50 border border-brand-100 text-brand-700 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:bg-brand-100 rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Job Description Summary
                </label>
                <div className="flex flex-col">
                  {renderEditorToolbar('description')}
                  <textarea
                    name="description"
                    required
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the primary responsibilities, scope, daily tasks, and project overview..."
                    className="w-full px-4 py-3 rounded-b-xl border border-surface-200 text-xs text-surface-750 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Requirements & Qualifications
                </label>
                <div className="flex flex-col">
                  {renderEditorToolbar('requirements')}
                  <textarea
                    name="requirements"
                    required
                    rows="4"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="Detail preferred tools, degree expectations, experience background, or specific tech requirements..."
                    className="w-full px-4 py-3 rounded-b-xl border border-surface-200 text-xs text-surface-750 bg-surface-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Job Status Visibility */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  Posting Visibility / Status
                </label>
                <div className="flex bg-surface-100 rounded-xl p-0.5 text-xs font-bold w-full">
                  {['Draft', 'Published', 'Closed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, status: s }))}
                      className={`flex-1 py-2 rounded-lg transition-all text-center ${
                        formData.status === s
                          ? 'bg-white text-surface-850 shadow-sm'
                          : 'text-surface-450 hover:text-surface-650'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* System Active Toggle */}
              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <label className="text-[10px] font-extrabold text-surface-500 uppercase tracking-wide">
                  System Active State
                </label>
                <div className="flex items-center gap-2.5 h-[34px]">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      formData.is_active !== false ? 'bg-emerald-500' : 'bg-surface-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                        formData.is_active !== false ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-surface-700">
                    {formData.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Form Buttons */}
            <div className="pt-6 border-t border-surface-100 flex justify-end gap-3">
              <Link
                to="/recruiter/jobs"
                className="bg-surface-50 hover:bg-surface-100 border border-surface-200 text-surface-700 font-semibold py-2.5 px-5 rounded-xl transition-all text-xs flex items-center gap-1.5"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-brand-500/10 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isEditMode ? 'Update Posting' : 'Publish Posting'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating success toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-250 shadow-xl text-sm font-semibold shadow-emerald-500/5 max-w-sm w-full sm:w-auto"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default JobFormPage
