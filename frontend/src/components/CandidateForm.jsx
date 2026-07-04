import React, { useState } from 'react'
import { User, Briefcase, FileText, Play } from 'lucide-react'

function CandidateForm({ onSubmit, isLoading }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [resume, setResume] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !role.trim() || !resume.trim()) {
      setError('Please fill in all fields to start the interview.')
      return
    }
    setError('')
    onSubmit({ name, role, resume })
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8">
      <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Setup Mock Interview</h2>
            <p className="text-slate-400 mt-2 text-sm">
              Enter the candidate details to customize interview questions using Gemini AI.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Candidate Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Alexander Wright"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-4 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Applied Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Briefcase className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Target Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer (React)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-4 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Resume Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Resume Text (Skills & Projects)
              </label>
              <textarea
                rows={6}
                placeholder="Paste the candidate's resume content or technical skills summary here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                disabled={isLoading}
              ></textarea>
            </div>

            {/* Start Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating Interview Session...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Interview Room</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CandidateForm
