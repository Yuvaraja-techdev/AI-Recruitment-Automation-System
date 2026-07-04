import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, BriefcaseBusiness, AlertCircle, CheckCircle2 } from 'lucide-react'
import { signup } from '../services/api'

function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all details')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    try {
      await signup(name, email, password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/') // Redirect to Candidate Home/Dashboard
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 py-12 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card border border-slate-100 p-8 space-y-6">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <BriefcaseBusiness className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-black text-surface-900 tracking-tight font-display">
            Create Candidate Account
          </h2>
          <p className="text-xs text-surface-500">
            Sign up to apply for jobs and take automated AI voice interviews.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col items-center text-center gap-3 text-emerald-800 animate-scale-up">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
            <div>
              <h3 className="font-bold text-sm">Account Created Successfully!</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Redirecting you to the portal gateway...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 animate-shake">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all placeholder-surface-450"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all placeholder-surface-450"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all placeholder-surface-450"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all placeholder-surface-450"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-md shadow-brand-600/10"
              >
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <span className="text-xs text-surface-400">Already have an account? </span>
              <Link
                to="/login"
                className="text-xs font-bold text-brand-650 hover:text-brand-700 transition-colors"
              >
                Log In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SignupPage
