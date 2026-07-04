import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Palette,
  Image,
  Save,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Eye,
  Building2,
  Globe,
  MapPin,
  Users,
  BriefcaseBusiness,
  Sparkles,
} from 'lucide-react'
import { getCompany, updateCompany } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'
import CompanySubNav from '../components/CompanySubNav'

// ─── Brand Theme Presets ──────────────────────────────────────────────────────
const THEME_PRESETS = [
  { name: 'Indigo Pro',    color: '#6366f1', banner: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  { name: 'Emerald',       color: '#059669', banner: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
  { name: 'Slate Dark',    color: '#334155', banner: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' },
  { name: 'Rose',          color: '#e11d48', banner: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' },
  { name: 'Amber',         color: '#d97706', banner: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
  { name: 'Sky',           color: '#0284c7', banner: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' },
  { name: 'Violet',        color: '#7c3aed', banner: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' },
  { name: 'Teal',          color: '#0d9488', banner: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' },
]

// Hex to RGB helper for opacity variants
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '99, 102, 241'
}

// ─── Live Preview Card ────────────────────────────────────────────────────────
const BrandPreviewCard = ({ form }) => {
  const initials = (form.name || 'HC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const rgb = hexToRgb(form.brand_color || '#6366f1')

  return (
    <div className="space-y-4">
      {/* Company Identity Card Preview */}
      <div className="rounded-2xl overflow-hidden border border-surface-200 shadow-lg">
        {/* Banner */}
        <div
          className="h-20 w-full transition-all duration-500"
          style={{
            background: form.banner_url
              ? `url(${form.banner_url}) center/cover no-repeat`
              : `linear-gradient(135deg, rgba(${rgb}, 0.15) 0%, rgba(${rgb}, 0.35) 100%)`,
          }}
        />
        <div className="bg-white px-5 pb-5">
          <div className="flex items-end gap-3 -mt-7 mb-3">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Logo"
                className="w-14 h-14 rounded-xl border-4 border-white shadow-md object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl border-4 border-white shadow-md flex items-center justify-center text-white font-black text-base flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: form.brand_color || '#6366f1' }}
              >
                {initials}
              </div>
            )}
            <div className="pb-0.5">
              <p className="font-bold text-surface-900 text-sm leading-tight">{form.name || 'Your Company'}</p>
              <p className="text-[11px] text-surface-400">{form.industry || 'Technology'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-surface-500">
            {form.headquarters && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {form.headquarters}
              </div>
            )}
            {form.size && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {form.size} employees
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Card Preview */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Job Listing Preview</span>
        </div>
        <div className="flex items-start gap-3">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-surface-100" />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 transition-colors duration-300"
              style={{ backgroundColor: form.brand_color || '#6366f1' }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-surface-900">Senior Frontend Engineer</p>
            <p className="text-[10px] text-surface-500">{form.name || 'Your Company'} · {form.headquarters || 'Remote'}</p>
          </div>
          <span
            className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ backgroundColor: form.brand_color || '#6366f1' }}
          >
            Apply
          </span>
        </div>
      </div>

      {/* Color Swatch Row */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 space-y-2">
        <p className="text-[9px] font-bold text-surface-400 uppercase tracking-widest">Brand Color System</p>
        <div className="flex gap-2">
          {[1, 0.8, 0.6, 0.4, 0.2, 0.1].map((opacity) => (
            <div
              key={opacity}
              className="flex-1 h-8 rounded-lg transition-colors duration-300"
              style={{ backgroundColor: `rgba(${rgb}, ${opacity})` }}
              title={`${Math.round(opacity * 100)}%`}
            />
          ))}
        </div>
        <p className="text-[10px] text-surface-500 font-mono">{form.brand_color || '#6366f1'}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CompanyBrandingPage = () => {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    headquarters: '',
    size: '',
    logo_url: '',
    banner_url: '',
    brand_color: '#6366f1',
  })

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompany()
        setCompany(data)
        setForm({
          name: data.name || '',
          industry: data.industry || '',
          headquarters: data.headquarters || '',
          size: data.size || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          brand_color: data.brand_color || '#6366f1',
        })
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to load company data.' })
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

  const applyTheme = (preset) => {
    setForm((prev) => ({ ...prev, brand_color: preset.color }))
  }

  const handleReset = () => {
    if (company) {
      setForm({
        name: company.name || '',
        industry: company.industry || '',
        headquarters: company.headquarters || '',
        size: company.size || '',
        logo_url: company.logo_url || '',
        banner_url: company.banner_url || '',
        brand_color: company.brand_color || '#6366f1',
      })
      setToast({ type: 'info', message: 'Branding reset to saved values.' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateCompany(company.id, form)
      setCompany(updated)
      setToast({ type: 'success', message: 'Branding saved successfully!' })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save branding. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton type="details" />

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-800 bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-surface-300'

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' :
            toast.type === 'error'   ? 'bg-red-600 text-white' :
                                       'bg-slate-700 text-white'
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
              Brand Studio
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              Customize your company's visual identity and theme
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shadow-brand-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      </div>

      <CompanySubNav />

      {/* Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── Left: Controls ─────────────────────────────────────────── */}
        <div className="xl:col-span-7 space-y-6">

          {/* Theme Presets */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50">
                <Sparkles className="w-4 h-4 text-brand-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">Quick Theme Presets</h3>
                <p className="text-[11px] text-surface-400 mt-0.5">
                  One-click brand color themes — preview updates instantly
                </p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isActive = form.brand_color === preset.color
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyTheme(preset)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                      isActive
                        ? 'border-surface-900 shadow-lg scale-[1.03]'
                        : 'border-transparent hover:border-surface-300 hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    {/* Color swatch */}
                    <div
                      className="h-14 w-full"
                      style={{ background: preset.banner }}
                    />
                    <div className="bg-white px-2 py-1.5 text-center">
                      <span className="text-[10px] font-bold text-surface-700">{preset.name}</span>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow">
                        <CheckCircle2 className="w-3 h-3 text-surface-900" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Brand Color Custom Picker */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50">
                <Palette className="w-4 h-4 text-brand-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">Custom Brand Color</h3>
                <p className="text-[11px] text-surface-400 mt-0.5">Pick any color using the color picker or enter a hex value</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  name="brand_color"
                  value={form.brand_color}
                  onChange={handleChange}
                  className="w-16 h-16 rounded-2xl border-2 border-surface-200 cursor-pointer p-1 bg-white shadow-sm"
                />
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Hex Value</label>
                  <input
                    type="text"
                    name="brand_color"
                    value={form.brand_color}
                    onChange={handleChange}
                    placeholder="#6366f1"
                    maxLength={7}
                    className={inputCls + ' font-mono tracking-widest'}
                  />
                </div>
                {/* Live dot preview */}
                <div
                  className="w-12 h-12 rounded-xl shadow-md flex-shrink-0 transition-colors duration-300"
                  style={{ backgroundColor: form.brand_color }}
                />
              </div>

              {/* Opacity shades */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Generated Shades</p>
                <div className="flex gap-1.5 h-8">
                  {[1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.12].map((op) => (
                    <div
                      key={op}
                      className="flex-1 rounded-md transition-colors duration-300"
                      style={{ backgroundColor: `rgba(${hexToRgb(form.brand_color)}, ${op})` }}
                      title={`${Math.round(op * 100)}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Banner */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-50">
                <Image className="w-4 h-4 text-brand-600" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">Logo & Banner</h3>
                <p className="text-[11px] text-surface-400 mt-0.5">Paste hosted image URLs for your logo and cover banner</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wider block">Company Logo URL</label>
                <div className="flex items-center gap-3">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      className="w-12 h-12 rounded-xl border border-surface-200 object-cover flex-shrink-0 shadow-sm"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm transition-colors duration-300"
                      style={{ backgroundColor: form.brand_color || '#6366f1' }}
                    >
                      {(form.name || 'HC').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <input
                    type="url"
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleChange}
                    placeholder="https://cdn.yourcompany.com/logo.png"
                    className={inputCls}
                  />
                </div>
                <p className="text-[10px] text-surface-400">Recommended: 256×256px PNG with transparent background</p>
              </div>

              {/* Banner URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-surface-600 uppercase tracking-wider block">Cover Banner URL</label>
                <input
                  type="url"
                  name="banner_url"
                  value={form.banner_url}
                  onChange={handleChange}
                  placeholder="https://cdn.yourcompany.com/banner.jpg"
                  className={inputCls}
                />
                {form.banner_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-surface-200 h-20">
                    <img
                      src={form.banner_url}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.parentElement.style.display = 'none' }}
                    />
                  </div>
                )}
                <p className="text-[10px] text-surface-400">Recommended: 1400×300px landscape. If empty, brand color gradient is used.</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right: Live Preview ─────────────────────────────────────── */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-surface-400" strokeWidth={1.8} />
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Live Preview</span>
          </div>
          <BrandPreviewCard form={form} />
          <p className="text-[10px] text-surface-400 text-center">
            Preview reflects changes instantly — click Save Branding to persist
          </p>
        </div>

      </div>
    </div>
  )
}

export default CompanyBrandingPage
