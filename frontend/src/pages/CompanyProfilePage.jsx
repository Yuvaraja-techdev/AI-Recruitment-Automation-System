import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Facebook,
  Save,
  Loader2,
  CheckCircle2,
  Palette,
  Image,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { getCompany, updateCompany } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'

// ─── Reusable Field Components ────────────────────────────────────────────────

const FormSection = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
    <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-brand-50">
        <Icon className="w-4 h-4 text-brand-600" strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-surface-900">{title}</h3>
        {description && <p className="text-[11px] text-surface-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </div>
)

const Field = ({ label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-surface-700 uppercase tracking-wider block">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-surface-400">{hint}</p>}
  </div>
)

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-800 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-surface-300'

const SocialField = ({ icon: Icon, label, value, name, onChange, placeholder, iconBg }) => (
  <div className="flex items-center gap-3">
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
      <Icon className="w-4 h-4" strokeWidth={1.8} />
    </div>
    <div className="flex-1 space-y-1">
      <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{label}</label>
      <input
        type="url"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  </div>
)

// ─── Size Options ─────────────────────────────────────────────────────────────
const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-Commerce',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Retail', 'Other',
]

// ─── Main Component ───────────────────────────────────────────────────────────

const CompanyProfilePage = () => {
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Fetch existing company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompany()
        setCompany(data)
        setForm({
          name: data.name || '',
          industry: data.industry || '',
          size: data.size || '',
          headquarters: data.headquarters || '',
          founded_year: data.founded_year || '',
          description: data.description || '',
          website: data.website || '',
          email: data.email || '',
          phone: data.phone || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          brand_color: data.brand_color || '#6366f1',
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          github: data.github || '',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
        })
      } catch (err) {
        setError('Failed to load company profile.')
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setToast({ type: 'error', message: 'Company name is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      }
      const updated = await updateCompany(company.id, payload)
      setCompany(updated)
      setToast({ type: 'success', message: 'Company profile saved successfully!' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton type="details" />

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        {error}
      </div>
    )
  }

  // Live preview initials
  const initials = (form.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
              Company Profile
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              Edit your organization's identity and public-facing information
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-brand-600/20"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      <CompanySubNav />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Live Preview Banner ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
          {/* Banner strip */}
          <div
            className="h-24 w-full transition-all duration-500"
            style={{
              background: form.banner_url
                ? `url(${form.banner_url}) center/cover no-repeat`
                : `linear-gradient(135deg, ${form.brand_color || '#6366f1'}33 0%, ${form.brand_color || '#6366f1'}66 100%)`,
            }}
          />
          <div className="px-6 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  className="w-16 h-16 rounded-xl border-4 border-white shadow-md object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-black flex-shrink-0 transition-colors duration-300"
                  style={{ background: form.brand_color || '#6366f1' }}
                >
                  {initials}
                </div>
              )}
              <div className="pb-1">
                <p className="font-bold text-surface-900 text-base leading-tight">
                  {form.name || 'Your Company Name'}
                </p>
                <p className="text-xs text-surface-400">{form.industry || 'Industry'} · {form.headquarters || 'Location'}</p>
              </div>
            </div>
            <p className="text-[10px] text-surface-400 italic">
              Live preview — changes appear here as you type
            </p>
          </div>
        </div>

        {/* ── Identity Section ────────────────────────────────────────── */}
        <FormSection
          title="Company Identity"
          description="Core information about your organization"
          icon={Building2}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Company Name" required>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. HireFlow Technologies"
                className={inputCls}
                required
              />
            </Field>

            <Field label="Industry">
              <select name="industry" value={form.industry} onChange={handleChange} className={inputCls}>
                <option value="">Select Industry</option>
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>

            <Field label="Company Size">
              <select name="size" value={form.size} onChange={handleChange} className={inputCls}>
                <option value="">Select Size</option>
                {SIZE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o} employees</option>
                ))}
              </select>
            </Field>

            <Field label="Founded Year">
              <input
                type="number"
                name="founded_year"
                value={form.founded_year}
                onChange={handleChange}
                placeholder="e.g. 2018"
                min="1900"
                max={new Date().getFullYear()}
                className={inputCls}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="About the Company" hint="Max 500 characters. Displayed on candidate-facing job listings.">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe your company's mission, culture, and what makes it a great place to work..."
                  className={inputCls + ' resize-none'}
                />
                <p className="text-[10px] text-surface-400 text-right">
                  {(form.description || '').length}/500
                </p>
              </Field>
            </div>
          </div>
        </FormSection>

        {/* ── Contact Section ─────────────────────────────────────────── */}
        <FormSection
          title="Contact Information"
          description="How candidates and clients can reach your company"
          icon={Mail}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Headquarters / Location">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  name="headquarters"
                  value={form.headquarters}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>

            <Field label="Company Website">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>

            <Field label="Hiring Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="hiring@yourcompany.com"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>

            <Field label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ── Branding Section ────────────────────────────────────────── */}
        <FormSection
          title="Branding & Visuals"
          description="Logo URL, banner, and brand color for your company workspace"
          icon={Palette}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Logo URL" hint="Direct link to a hosted PNG/JPG image">
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="url"
                  name="logo_url"
                  value={form.logo_url}
                  onChange={handleChange}
                  placeholder="https://cdn.yourcompany.com/logo.png"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>

            <Field label="Banner Image URL" hint="Recommended: 1400×300px landscape image">
              <div className="relative">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="url"
                  name="banner_url"
                  value={form.banner_url}
                  onChange={handleChange}
                  placeholder="https://cdn.yourcompany.com/banner.jpg"
                  className={inputCls + ' pl-9'}
                />
              </div>
            </Field>

            <Field label="Brand Color" hint="Used for avatars, banners, and accent elements">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="brand_color"
                  value={form.brand_color}
                  onChange={handleChange}
                  className="w-12 h-10 rounded-xl border border-surface-200 cursor-pointer p-1 bg-white"
                />
                <input
                  type="text"
                  name="brand_color"
                  value={form.brand_color}
                  onChange={handleChange}
                  placeholder="#6366f1"
                  maxLength={7}
                  className={inputCls + ' font-mono'}
                />
              </div>
            </Field>
          </div>
        </FormSection>

        {/* ── Social Links Section ─────────────────────────────────────── */}
        <FormSection
          title="Social Media & Online Presence"
          description="Connect your company's social profiles"
          icon={ExternalLink}
        >
          <div className="space-y-4">
            <SocialField
              icon={Linkedin}
              label="LinkedIn"
              name="linkedin"
              value={form.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/yourcompany"
              iconBg="bg-blue-50 text-blue-600"
            />
            <SocialField
              icon={Twitter}
              label="Twitter / X"
              name="twitter"
              value={form.twitter}
              onChange={handleChange}
              placeholder="https://twitter.com/yourcompany"
              iconBg="bg-sky-50 text-sky-500"
            />
            <SocialField
              icon={Github}
              label="GitHub"
              name="github"
              value={form.github}
              onChange={handleChange}
              placeholder="https://github.com/yourcompany"
              iconBg="bg-surface-100 text-surface-700"
            />
            <SocialField
              icon={Instagram}
              label="Instagram"
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/yourcompany"
              iconBg="bg-pink-50 text-pink-500"
            />
            <SocialField
              icon={Facebook}
              label="Facebook"
              name="facebook"
              value={form.facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/yourcompany"
              iconBg="bg-indigo-50 text-indigo-600"
            />
          </div>
        </FormSection>

        {/* Bottom save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/recruiter/company"
            className="px-5 py-2.5 rounded-xl border border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-brand-600/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  )
}

export default CompanyProfilePage
