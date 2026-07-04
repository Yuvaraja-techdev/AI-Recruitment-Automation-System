import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Building2,
  Globe,
  Clock,
  Calendar,
  Briefcase,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Users,
} from 'lucide-react'
import { getCompany, updateCompany } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120]

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-Commerce',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Retail', 'Other',
]

const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

const TABS = [
  { id: 'info',      label: 'Company Info',      icon: Building2 },
  { id: 'schedule',  label: 'Work Schedule',      icon: Calendar },
  { id: 'hiring',    label: 'Hiring Preferences', icon: Briefcase },
  { id: 'signature', label: 'Email Signature',    icon: FileText },
]

// ─── Reusable Field ───────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-800 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-surface-300'

const Field = ({ label, hint, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wider block">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-surface-400">{hint}</p>}
  </div>
)

const SectionHeader = ({ title, description }) => (
  <div className="pb-4 mb-5 border-b border-surface-100">
    <h3 className="text-base font-bold text-surface-900">{title}</h3>
    {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const OrgSettingsPage = () => {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    // Company Info
    name: '',
    industry: '',
    size: '',
    headquarters: '',
    founded_year: '',
    website: '',
    email: '',
    phone: '',
    description: '',
    // Schedule
    timezone: 'UTC',
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    // Hiring
    interview_duration: 30,
    // Signature
    recruiter_signature: '',
  })

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getCompany()
        setCompany(data)
        setForm({
          name:                data.name || '',
          industry:            data.industry || '',
          size:                data.size || '',
          headquarters:        data.headquarters || '',
          founded_year:        data.founded_year || '',
          website:             data.website || '',
          email:               data.email || '',
          phone:               data.phone || '',
          description:         data.description || '',
          timezone:            data.timezone || 'UTC',
          working_days:        data.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          interview_duration:  data.interview_duration || 30,
          recruiter_signature: data.recruiter_signature || '',
        })
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to load settings.' })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const toggleWorkDay = (day) => {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day],
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setToast({ type: 'error', message: 'Company name is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        interview_duration: parseInt(form.interview_duration),
      }
      const updated = await updateCompany(company.id, payload)
      setCompany(updated)
      setToast({ type: 'success', message: 'Organization settings saved!' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton type="details" />

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
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
            <div className="p-2.5 rounded-xl bg-brand-50">
              <Settings className="w-5 h-5 text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
                Organization Settings
              </h1>
              <p className="text-sm text-surface-500 mt-0.5">
                Configure organization-wide preferences and defaults
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shadow-brand-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <CompanySubNav />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-surface-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-all ${
              activeTab === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden p-6 sm:p-8">

        {/* ── Tab 1: Company Information ──────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <SectionHeader
              title="Company Information"
              description="Core details about your organization. These appear on job listings and recruiter communications."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Company Name" required>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="HireFlow Technologies" className={inputCls} required />
              </Field>

              <Field label="Industry">
                <select name="industry" value={form.industry} onChange={handleChange} className={inputCls}>
                  <option value="">Select Industry</option>
                  {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="Company Size">
                <select name="size" value={form.size} onChange={handleChange} className={inputCls}>
                  <option value="">Select Size</option>
                  {SIZE_OPTIONS.map(o => <option key={o} value={o}>{o} employees</option>)}
                </select>
              </Field>

              <Field label="Founded Year">
                <input type="number" name="founded_year" value={form.founded_year} onChange={handleChange} placeholder="2018" min="1900" max={new Date().getFullYear()} className={inputCls} />
              </Field>

              <Field label="Headquarters">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="text" name="headquarters" value={form.headquarters} onChange={handleChange} placeholder="San Francisco, CA" className={inputCls + ' pl-9'} />
                </div>
              </Field>

              <Field label="Company Website">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="https://yourcompany.com" className={inputCls + ' pl-9'} />
                </div>
              </Field>

              <Field label="Hiring Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="hiring@yourcompany.com" className={inputCls + ' pl-9'} />
                </div>
              </Field>

              <Field label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={inputCls + ' pl-9'} />
                </div>
              </Field>

              <div className="md:col-span-2">
                <Field label="About the Company" hint="Displayed on public-facing job listings (max 500 chars).">
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} maxLength={500} placeholder="Describe your company's mission and culture…" className={inputCls + ' resize-none'} />
                  <p className="text-[10px] text-surface-400 text-right">{(form.description || '').length}/500</p>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Work Schedule ─────────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <SectionHeader
              title="Work Schedule & Timezone"
              description="Set your organization's working hours and timezone. These defaults apply to interview scheduling."
            />

            <Field label="Default Timezone" hint="All interview slots will be shown in this timezone.">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <select name="timezone" value={form.timezone} onChange={handleChange} className={inputCls + ' pl-9'}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Working Days" hint="Select the days your team is available for interviews.">
              <div className="flex flex-wrap gap-2 pt-1">
                {WEEKDAYS.map(day => {
                  const active = form.working_days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkDay(day)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                        active
                          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                          : 'bg-white text-surface-500 border-surface-200 hover:border-brand-300 hover:text-brand-600'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-surface-400 mt-1">
                Selected: {form.working_days.length > 0
                  ? form.working_days.join(', ')
                  : 'None selected'}
              </p>
            </Field>

            {/* Visual working week preview */}
            <div className="bg-surface-50 rounded-2xl p-4 border border-surface-100">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-3">Weekly Schedule Preview</p>
              <div className="flex gap-1">
                {WEEKDAYS.map(day => {
                  const active = form.working_days.includes(day)
                  return (
                    <div key={day} className="flex-1 text-center">
                      <div
                        className={`h-14 rounded-xl flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                          active
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-surface-200 text-surface-400'
                        }`}
                      >
                        {day[0]}
                      </div>
                      <span className="text-[8px] text-surface-400">{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Hiring Preferences ────────────────────────────────────── */}
        {activeTab === 'hiring' && (
          <div className="space-y-6">
            <SectionHeader
              title="Hiring Preferences"
              description="Set default values for interviews and recruitment workflows across your organization."
            />

            <Field label="Default Interview Duration" hint="Duration applied when scheduling new AI interviews.">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {INTERVIEW_DURATIONS.map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, interview_duration: dur }))}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.interview_duration === dur
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-surface-500 border-surface-200 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-surface-400 mt-2">
                Currently set to: <strong>{form.interview_duration} minutes</strong>
              </p>
            </Field>

            {/* Summary preview */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">Current Hiring Configuration</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Clock,    label: 'Interview Duration', value: `${form.interview_duration} min` },
                  { icon: Globe,    label: 'Timezone',           value: form.timezone || '—' },
                  { icon: Calendar, label: 'Working Days',       value: form.working_days?.join(', ') || '—' },
                  { icon: Users,    label: 'Company Size',       value: form.size || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-brand-100">
                    <div className="p-2 rounded-lg bg-brand-100">
                      <Icon className="w-4 h-4 text-brand-700" />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-bold text-brand-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Recruiter Signature ──────────────────────────────────── */}
        {activeTab === 'signature' && (
          <div className="space-y-6">
            <SectionHeader
              title="Default Recruiter Email Signature"
              description="This signature is appended to offer letters, interview invites, and automated emails sent from HireFlow."
            />

            <Field label="Signature Text" hint="Plain text or simple formatting. Used across all outgoing recruiter emails.">
              <textarea
                name="recruiter_signature"
                value={form.recruiter_signature}
                onChange={handleChange}
                rows={8}
                placeholder={`Best regards,\n\nHireFlow Recruiting Team\n${form.email || 'hiring@yourcompany.com'}\n${form.website || 'https://yourcompany.com'}`}
                className={inputCls + ' resize-none font-mono text-xs leading-relaxed'}
              />
              <p className="text-[10px] text-surface-400 text-right">
                {(form.recruiter_signature || '').length} characters
              </p>
            </Field>

            {/* Live Preview */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Email Preview</p>
              <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 space-y-4">
                {/* Mock email header */}
                <div className="border-b border-surface-200 pb-3 space-y-1">
                  <p className="text-xs text-surface-500"><span className="font-bold">From:</span> {form.email || 'hiring@yourcompany.com'}</p>
                  <p className="text-xs text-surface-500"><span className="font-bold">Subject:</span> Interview Invitation — {form.name || 'Your Company'}</p>
                </div>
                <p className="text-xs text-surface-600">Dear Candidate,</p>
                <p className="text-xs text-surface-600">
                  We are pleased to invite you for an AI-assisted interview for the role you applied to at {form.name || 'our company'}.
                  Please use the link below to access your interview session…
                </p>
                <div className="pt-2 border-t border-surface-200">
                  <pre className="text-xs text-surface-600 whitespace-pre-wrap font-mono leading-relaxed">
                    {form.recruiter_signature ||
                      `Best regards,\n\n${form.name || 'HireFlow Recruiting Team'}\n${form.email || 'hiring@yourcompany.com'}\n${form.website || ''}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Row */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-surface-100">
          <Link
            to="/recruiter/company"
            className="px-5 py-2.5 rounded-xl border border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shadow-brand-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

    </div>
  )
}

export default OrgSettingsPage
