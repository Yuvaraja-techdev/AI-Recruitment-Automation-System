import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, BriefcaseBusiness, AlertCircle, Sparkles } from 'lucide-react'
import { login } from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('CANDIDATE') // 'CANDIDATE' | 'RECRUITER' | 'ADMIN'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all credentials')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await login(email, password, role)
      // Redirect based on user authorization role
      if (role === 'CANDIDATE') {
        navigate('/') // Candidate Dashboard
      } else {
        navigate('/recruiter') // Recruiter/Admin Dashboard
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect email, password, or role selection.')
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
            Welcome back to HireFlow
          </h2>
          <p className="text-xs text-surface-500">
            Sign in to access your recruitment workspace.
          </p>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-3 bg-slate-50 border border-slate-200 p-1 rounded-xl">
          {['CANDIDATE', 'RECRUITER', 'ADMIN'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setRole(item)
                setError('')
              }}
              className={`py-2 text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all ${
                role === item
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-100'
                  : 'text-surface-450 hover:text-surface-700'
              }`}
            >
              {item.toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 animate-shake">
            <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Credentials Helpers Hint */}
        {role !== 'CANDIDATE' && (
          <div className="bg-brand-50/30 border border-brand-100/50 rounded-xl p-3 flex items-start gap-2 text-[11px] text-brand-800">
            <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold">Sandbox Hint:</span> Use email{' '}
              <span className="font-mono text-brand-900 font-bold">
                {role.toLowerCase()}@hireflow.com
              </span>{' '}
              and password <span className="font-mono text-brand-900 font-bold">password</span> to bypass login.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-800 focus:bg-white focus:outline-none focus:border-brand-500 transition-all placeholder-surface-450"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-surface-450 uppercase tracking-wide block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-brand-650 hover:text-brand-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {role === 'CANDIDATE' && (
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-xs text-surface-400">Are you a candidate? </span>
            <Link
              to="/signup"
              className="text-xs font-bold text-brand-650 hover:text-brand-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
