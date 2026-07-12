import React from 'react'
import { MapPin, IndianRupee, Star, BriefcaseBusiness, Sparkles, Calendar, AlertCircle } from 'lucide-react'

const calculateMatchPct = (jobSkills, candidateSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 80 // baseline
  if (!candidateSkills || candidateSkills.length === 0) return 60 // baseline with empty profile
  
  const jobSet = new Set(jobSkills.map(s => s.toLowerCase()))
  const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase()))
  
  let matches = 0
  jobSet.forEach(s => {
    if (candidateSet.has(s)) matches++
  })
  
  const pct = Math.round((matches / jobSet.size) * 100)
  return Math.min(Math.max(pct, 55), 99)
}

// Helper to assign a dynamic gradient background to companies
const getCompanyBrandColor = (companyName = '') => {
  const charCode = companyName.charCodeAt(0) || 65
  if (charCode <= 70) return 'from-indigo-500 to-blue-500 text-white' // A-F
  if (charCode <= 75) return 'from-emerald-500 to-teal-500 text-white' // G-K
  if (charCode <= 80) return 'from-amber-500 to-orange-500 text-white' // L-P
  if (charCode <= 85) return 'from-purple-500 to-indigo-600 text-white' // Q-U
  return 'from-rose-500 to-pink-500 text-white' // V-Z
}

const JobCard = ({
  job,
  isBookmarked,
  candidateSkills = [],
  onBookmarkToggle,
  onApply,
  showRemoveLabel = false
}) => {
  const matchPct = calculateMatchPct(job.skills, candidateSkills)
  const isHighMatch = matchPct >= 80

  // Dynamic tags
  const isRecent = job.id % 3 === 0
  const isUrgent = job.id % 2 === 0

  // Fallback company logo text
  const initials = (job.company || 'C')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const brandGradient = getCompanyBrandColor(job.company)

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-card hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-300 group relative">
      
      {/* Absolute badge row inside card corner */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={() => onBookmarkToggle(job.id)}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Job'}
          className={`p-2 rounded-xl border transition-all ${
            isBookmarked
              ? 'bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100'
              : 'bg-transparent text-slate-300 border-slate-150 hover:bg-slate-50 hover:text-slate-500'
          }`}
        >
          <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Header Block */}
        <div className="flex items-start gap-3">
          {/* Styled Dynamic Gradient Logo */}
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0`}>
            {initials}
          </div>
          <div className="pr-12">
            <h4 className="text-sm font-extrabold text-surface-900 font-display group-hover:text-brand-600 transition-colors leading-tight">
              {job.title}
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-1">{job.company}</p>
          </div>
        </div>

        {/* Dynamic Highlight Badges */}
        <div className="flex flex-wrap gap-1.5">
          {/* High AI Match */}
          {isHighMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-extrabold">
              <Sparkles className="w-3 h-3 fill-current animate-pulse" />
              {matchPct}% Match
            </span>
          )}
          {/* Recently Posted */}
          {isRecent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-150 text-[10px] font-extrabold">
              <Calendar className="w-3 h-3" />
              Recent
            </span>
          )}
          {/* Urgent Hiring */}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-extrabold">
              <AlertCircle className="w-3 h-3" />
              Urgent
            </span>
          )}
        </div>

        {/* Details list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-550 font-medium">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Location</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold truncate">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {job.location}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Annual Salary</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold truncate">
              <IndianRupee className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {job.salary}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Experience</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold truncate">
              <BriefcaseBusiness className="w-3 h-3 text-slate-400 flex-shrink-0" />
              {job.experience}
            </span>
          </div>
        </div>
      </div>

      {/* Skills tags and Actions footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-1">
        <div className="flex flex-wrap gap-1 max-w-[60%]">
          {job.skills && job.skills.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-50 text-slate-550 border border-slate-150 text-[9px] font-bold uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
          {job.skills && job.skills.length > 3 && (
            <span className="text-[9px] text-slate-400 font-bold self-center">+{job.skills.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {showRemoveLabel && (
            <button
              type="button"
              onClick={() => onBookmarkToggle(job.id)}
              className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1.5 transition-colors"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => onApply(job)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default JobCard
