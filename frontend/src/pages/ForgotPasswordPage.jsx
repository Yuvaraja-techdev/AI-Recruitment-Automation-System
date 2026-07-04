import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, BriefcaseBusiness, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { forgotPassword } from '../services/api'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please fill in your email address')
      return
    }

    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
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
            Forgot Password
          </h2>
          <p className="text-xs text-surface-500">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col items-center text-center gap-3 text-emerald-800 animate-scale-up">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <div>
              <h3 className="font-bold text-sm">Reset Link Sent</h3>
              <p className="text-[11px] text-emerald-600 mt-1">
                If the email is associated with an active account, we have sent a reset password link to your inbox.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-2 text-xs font-bold text-brand-650 hover:text-brand-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-md shadow-brand-600/10"
              >
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="text-xs font-bold text-brand-650 hover:text-brand-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
