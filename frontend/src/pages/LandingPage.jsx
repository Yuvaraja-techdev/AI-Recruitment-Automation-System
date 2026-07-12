import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  IndianRupee,
  TrendingUp,
  Users,
  Building,
  ArrowRight,
  Sparkles,
  BriefcaseBusiness,
  CheckCircle2,
} from 'lucide-react'

function LandingPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  // curated featured jobs
  const featuredJobs = [
    {
      id: 'job-1',
      title: 'AIML Intern',
      company: 'HireFlow Solutions',
      location: 'Bengaluru, Karnataka (On-site)',
      salary: '₹3 - ₹5 LPA',
      type: 'Internship',
      tags: ['Python', 'ML', 'FastAPI'],
    },
    {
      id: 'job-2',
      title: 'Flutter Developer',
      company: 'HireFlow Solutions',
      location: 'Hyderabad, Telangana (On-site)',
      salary: '₹8 - ₹14 LPA',
      type: 'Full-time',
      tags: ['Flutter', 'Firebase', 'Dart'],
    },
    {
      id: 'job-3',
      title: 'GenAI Engineer',
      company: 'HireFlow Solutions',
      location: 'Pune, Maharashtra (Hybrid)',
      salary: '₹15 - ₹25 LPA',
      type: 'Full-time',
      tags: ['LLM', 'RAG', 'Python'],
    },
    {
      id: 'job-4',
      title: 'Backend Developer',
      company: 'HireFlow Solutions',
      location: 'Noida, Uttar Pradesh (On-site)',
      salary: '₹8 - ₹14 LPA',
      type: 'Full-time',
      tags: ['Python', 'FastAPI', 'MySQL'],
    },
  ]

  // platform statistics
  const stats = [
    { label: 'Applications Handled', value: '45,200+', icon: Users, color: 'text-brand-600 bg-brand-50' },
    { label: 'ATS Screening Speed', value: '< 2.4s', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Corporate Partners', value: '1,200+', icon: Building, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Interview Success Rate', value: '94.6%', icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
  ]

  // partners brands list
  const partners = [
    'Slack Technologies',
    'Airbnb Labs',
    'Uber Advanced Tech Group',
    'Dropbox Inc.',
    'GitHub Inc.',
    'Spotify Sweden',
  ]

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20">
              <BriefcaseBusiness className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-extrabold font-display text-surface-900 tracking-tight leading-none">
                HireFlow
              </h1>
              <p className="text-[10px] text-surface-450 font-bold uppercase tracking-wider mt-0.5">
                AI Recruitment
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-surface-600">
            <Link to="/jobs" className="hover:text-brand-650 transition-colors">Find Jobs</Link>
            <a href="#stats" className="hover:text-brand-650 transition-colors">Statistics</a>
            <a href="#featured-jobs" className="hover:text-brand-650 transition-colors">Featured Roles</a>
            <a href="#partners" className="hover:text-brand-650 transition-colors">Corporate Partners</a>
          </nav>

          <div className="flex items-center gap-3">
            {(() => {
              const userString = localStorage.getItem('user')
              if (userString) {
                try {
                  const user = JSON.parse(userString)
                  return (
                    <>
                      <Link
                        to={user.role === 'CANDIDATE' ? '/dashboard' : '/recruiter'}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-600/10"
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          localStorage.removeItem('token')
                          localStorage.removeItem('user')
                          navigate('/')
                          window.location.reload()
                        }}
                        className="text-red-500 hover:text-red-750 text-xs font-bold px-3 py-2 bg-red-50 rounded-xl transition-all"
                      >
                        Sign Out
                      </button>
                    </>
                  )
                } catch (e) {
                  // Fallback
                }
              }
              return (
                <>
                  <Link
                    to="/login"
                    className="text-surface-650 hover:text-brand-700 text-xs font-bold px-3 py-2 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-600/10"
                  >
                    Create Account
                  </Link>
                  <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                  <Link
                    to="/recruiter"
                    className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-100/10 hidden sm:block"
                  >
                    Recruiter Dashboard
                  </Link>
                </>
              )
            })()}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero" className="relative bg-white border-b border-slate-150 py-16 lg:py-24 overflow-hidden">
        {/* Background gradient flares */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Engineered Automated Recruitment Workspace
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-surface-900 tracking-tight max-w-3xl leading-[1.1] mb-6">
            Land Your Dream Role with{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              AI-Guided
            </span>{' '}
            Screening
          </h2>

          <p className="text-base text-surface-550 max-w-xl leading-relaxed mb-10">
            Submit your resume, get scanned instantly with deep ATS analytics, match skills with top employers, and take dynamic voice interviews seamlessly.
          </p>

          {/* Search Bar Panel */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:flex sm:items-center gap-2 shadow-card"
          >
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 sm:py-0 border-b sm:border-b-0 sm:border-r border-slate-200">
              <Search className="w-5 h-5 text-surface-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Job title, keywords, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-surface-800 placeholder-surface-400 focus:outline-none w-full"
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-3.5 py-3 sm:py-0">
              <MapPin className="w-5 h-5 text-surface-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="City, state, or remote..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="bg-transparent text-sm text-surface-800 placeholder-surface-400 focus:outline-none w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-600/10"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      {/* 3. Platform Statistics */}
      <section id="stats" className="py-12 bg-white border-b border-slate-150">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-slate-50/50"
                >
                  <div className={`p-3 rounded-xl ${stat.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-surface-900 block tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[11px] font-bold text-surface-450 uppercase tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Featured Jobs Grid */}
      <section id="featured-jobs" className="py-16 lg:py-20 flex-grow">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-extrabold text-surface-900 tracking-tight font-display">
                Featured Career Opportunities
              </h3>
              <p className="text-xs text-surface-500">
                Explore handpicked engineering roles with matched skills and automated application pipelines.
              </p>
            </div>
            
            <Link
              to="/jobs"
              className="text-xs font-bold text-brand-650 hover:text-brand-700 flex items-center gap-1 group self-start"
            >
              <span>Browse All Positions</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-6 hover:shadow-card hover:border-slate-350 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-base font-bold text-surface-900 font-display">
                        {job.title}
                      </h4>
                      <p className="text-xs text-surface-500 mt-0.5">{job.company}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {job.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-surface-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-surface-400" />
                      {job.salary}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-650 text-[10px] font-semibold border border-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Partners Section */}
      <section id="partners" className="py-12 bg-white border-t border-b border-slate-150">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block">
            Partnered with Leading Engineering Teams
          </span>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
            {partners.map((partner, index) => (
              <span
                key={index}
                className="text-sm font-bold text-surface-600 font-mono tracking-tight hover:opacity-100 transition-opacity"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-white py-8 border-t border-slate-150 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-surface-450 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <BriefcaseBusiness className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-surface-900 font-display">HireFlow Inc.</span>
            <span>© 2026 AI Recruitment Automation System. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#hero" className="hover:text-surface-600 transition-colors">Privacy Policy</a>
            <a href="#stats" className="hover:text-surface-600 transition-colors">Terms of Service</a>
            <a href="#featured-jobs" className="hover:text-surface-600 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
