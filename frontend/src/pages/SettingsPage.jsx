import { useState, useEffect } from 'react'
import {
  Settings,
  User,
  Sliders,
  Link2,
  Save,
  CheckCircle2,
  Calendar,
  Mail,
  Cpu,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)
  
  // Profile settings state
  const [profile, setProfile] = useState(() => {
    try {
      const userString = localStorage.getItem('user')
      if (userString) {
        const user = JSON.parse(userString)
        return {
          name: user.name || 'Recruiter Admin',
          email: user.email || 'admin@hireflow.ai',
          role: user.role === 'recruiter' ? 'Senior Tech Recruiter' : 'Candidate User',
          company: 'HireFlow Tech',
        }
      }
    } catch (e) {
      // fallback
    }
    return {
      name: 'Recruiter Admin',
      email: 'admin@hireflow.ai',
      role: 'Senior Tech Recruiter',
      company: 'HireFlow Tech',
    }
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences settings state
  const [theme, setTheme] = useState(localStorage.getItem('theme-preference') || 'light')
  const [notifications, setNotifications] = useState({
    newApplications: true,
    interviewComplete: true,
    aiScoreDigests: false,
    soundEffects: true,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Integrations mock state
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    emailSmtp: false,
    openai: true, // OpenAI evaluation fallback active
  })
  const [connectingId, setConnectingId] = useState(null)

  // Auto dismiss Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleProfileSave = (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setTimeout(() => {
      setSavingProfile(false)
      try {
        const userString = localStorage.getItem('user')
        if (userString) {
          const user = JSON.parse(userString)
          user.name = profile.name
          user.email = profile.email
          localStorage.setItem('user', JSON.stringify(user))
          // Trigger a storage event to update other components (e.g. Navbar)
          window.dispatchEvent(new Event('storage'))
        }
      } catch (err) {}
      setToast({ message: 'Profile settings saved successfully!', type: 'success' })
    }, 800)
  }

  const handlePreferencesSave = () => {
    setSavingPrefs(true)
    localStorage.setItem('theme-preference', theme)
    setTimeout(() => {
      setSavingPrefs(false)
      setToast({ message: 'Application preferences saved successfully!', type: 'success' })
    }, 800)
  }

  const handleToggleIntegration = (key) => {
    setConnectingId(key)
    setTimeout(() => {
      setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }))
      setConnectingId(null)
      setToast({
        message: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} status updated!`,
        type: 'success',
      })
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-brand-50">
          <Settings className="w-5 h-5 text-brand-600" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-surface-500">Configure recruiter profile, layout themes, and API services</p>
        </div>
      </div>

      {/* Tabs Layout Navigation */}
      <div className="flex border-b border-surface-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-surface-450 hover:text-surface-650 hover:border-surface-300'
          }`}
        >
          <User className="w-4 h-4" />
          Recruiter Profile
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'preferences'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-surface-450 hover:text-surface-650 hover:border-surface-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Preferences & Theme
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'integrations'
              ? 'border-brand-600 text-brand-700 font-bold'
              : 'border-transparent text-surface-450 hover:text-surface-650 hover:border-surface-300'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Integrations Hub
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-card overflow-hidden p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.form
              key="profile"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              onSubmit={handleProfileSave}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-surface-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/20">
                  {profile.name.charAt(0)}
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-base font-bold text-surface-900">Avatar Image</h3>
                  <p className="text-xs text-surface-400">Placeholder avatar generated from profile initials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all bg-surface-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all bg-surface-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wide">Role Title</label>
                  <input
                    type="text"
                    required
                    value={profile.role}
                    onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all bg-surface-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wide">Organization</label>
                  <input
                    type="text"
                    required
                    value={profile.company}
                    onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all bg-surface-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              {/* Theme preference */}
              <div className="space-y-3 pb-6 border-b border-surface-100">
                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">Layout Theme</h3>
                <div className="flex gap-4">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        theme === t
                          ? 'border-brand-600 bg-brand-50/50 text-brand-700'
                          : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                      }`}
                    >
                      {t.replace(/^\w/, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">Notification Settings</h3>
                <div className="space-y-3">
                  <PreferenceToggle
                    label="Email notifications for new applications"
                    subtitle="Receive updates instantly as candidates submit details."
                    checked={notifications.newApplications}
                    onChange={(val) => setNotifications((n) => ({ ...n, newApplications: val }))}
                  />
                  <PreferenceToggle
                    label="AI Evaluation screening digests"
                    subtitle="Receive batch emails summarizing daily ATS evaluation metrics."
                    checked={notifications.aiScoreDigests}
                    onChange={(val) => setNotifications((n) => ({ ...n, aiScoreDigests: val }))}
                  />
                  <PreferenceToggle
                    label="Sound alert effects"
                    subtitle="Play notification alerts on important pipeline status events."
                    checked={notifications.soundEffects}
                    onChange={(val) => setNotifications((n) => ({ ...n, soundEffects: val }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handlePreferencesSave}
                  disabled={savingPrefs}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {savingPrefs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Preferences
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-5"
            >
              <IntegrationCard
                icon={Calendar}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
                name="Google Calendar"
                description="Automatically synchronize scheduled AI interviews to candidate and recruiter calendars."
                connected={integrations.googleCalendar}
                onToggle={() => handleToggleIntegration('googleCalendar')}
                loading={connectingId === 'googleCalendar'}
              />
              <IntegrationCard
                icon={Mail}
                iconColor="text-purple-600"
                iconBg="bg-purple-50"
                name="Email (SMTP Server)"
                description="Use your company's custom email client to send out outreach emails and invite digests."
                connected={integrations.emailSmtp}
                onToggle={() => handleToggleIntegration('emailSmtp')}
                loading={connectingId === 'emailSmtp'}
              />
              <IntegrationCard
                icon={Cpu}
                iconColor="text-indigo-600"
                iconBg="bg-indigo-50"
                name="OpenAI GPT Engine"
                description="Power structural screening reviews and dynamic ATS evaluation metrics with GPT-4."
                connected={integrations.openai}
                onToggle={() => handleToggleIntegration('openai')}
                loading={connectingId === 'openai'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Success Toaster */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xl text-sm font-semibold shadow-emerald-500/5 max-w-sm w-full sm:w-auto"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Reusable preference check row */
const PreferenceToggle = ({ label, subtitle, checked, onChange }) => (
  <label className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-50/50 border border-transparent hover:border-surface-100 transition-all cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500 cursor-pointer"
    />
    <div className="space-y-0.5">
      <p className="text-sm font-semibold text-surface-800">{label}</p>
      <p className="text-xs text-surface-400">{subtitle}</p>
    </div>
  </label>
)

/** Reusable integration info card */
const IntegrationCard = ({ icon: Icon, iconColor, iconBg, name, description, connected, onToggle, loading }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-surface-100 hover:border-surface-200 transition-colors">
    <div className="flex gap-4 items-start">
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-surface-900">{name}</h4>
        <p className="text-xs text-surface-500 leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
    <div className="flex items-center sm:justify-end gap-3 flex-shrink-0">
      <span
        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          connected ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-100 text-surface-500'
        }`}
      >
        {connected ? 'Active' : 'Disconnected'}
      </span>
      <button
        onClick={onToggle}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
          connected
            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
            : 'bg-brand-600 text-white border-brand-500/10 hover:bg-brand-700'
        } disabled:opacity-50`}
      >
        {loading ? 'Processing...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  </div>
)

export default SettingsPage
