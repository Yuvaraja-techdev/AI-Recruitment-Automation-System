import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Brain,
  Award,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Cpu,
  Mic,
  Briefcase,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { getCandidateById, getMyApplications } from '../services/api'
import LoadingSkeleton from '../components/LoadingSkeleton'

function CandidateInsightsPage() {
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInsights = async () => {
      const userString = localStorage.getItem('user')
      if (!userString) {
        navigate('/login')
        return
      }

      try {
        const user = JSON.parse(userString)
        if (!user.candidate_id) {
          setError('Recruiter and Admin accounts do not require insights workspaces.')
          setLoading(false)
          return
        }

        const candidateId = user.candidate_id
        
        // Fetch DB states
        const candData = await getCandidateById(candidateId)
        setCandidate(candData)

        const apps = await getMyApplications()
        setApplications(apps)

      } catch (err) {
        setError('Failed to load candidate insights.')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [navigate])

  if (loading) return <LoadingSkeleton type="analytics" />
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-red-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center max-w-sm shadow-sm">
        <XCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-bold text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="text-xs font-bold text-brand-600 hover:underline">Retry</button>
      </div>
    </div>
  )
  if (!candidate) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-center max-w-sm shadow-sm">
        <AlertCircle className="w-8 h-8 text-slate-400" />
        <p className="text-sm font-bold text-slate-700">Candidate profile not found.</p>
      </div>
    </div>
  )

  const safeArray = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    try {
      if (typeof val === 'string') {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {}
    return []
  }

  const missingSkills = safeArray(candidate.missing_skills)
  const matchedSkills = safeArray(candidate.matched_skills)

  // Chart data: Candidate skill parameters match score dimensions
  const skillDimensionsData = [
    { name: 'ATS Match', Score: candidate.ats_score || 80, FullMark: 100 },
    { name: 'Core Tech', Score: matchedSkills.length > 0 ? Math.min(65 + matchedSkills.length * 5, 95) : 75, FullMark: 100 },
    { name: 'Oral Comm', Score: candidate.overall_score ? candidate.overall_score * 10 : 70, FullMark: 100 },
    { name: 'Keyword Alignment', Score: candidate.ats_score ? Math.min(candidate.ats_score + 5, 99) : 80, FullMark: 100 },
    { name: 'Academics', Score: candidate.education?.length > 0 ? 90 : 80, FullMark: 100 },
  ]

  // Dynamic status distributions counts
  const totalCount = applications.length
  const screeningCount = applications.filter((a) => a.status === 'PENDING').length
  const selectedCount = candidate.status === 'SELECTED' ? 1 : 0
  const rejectedCount = candidate.status === 'REJECTED' ? 1 : 0
  const interviewingCount = candidate.status === 'INTERVIEWING' ? 1 : 0

  const statusDistributionData = [
    { name: 'Screening', Count: screeningCount },
    { name: 'Interview', Count: interviewingCount },
    { name: 'Shortlisted', Count: selectedCount },
    { name: 'Closed', Count: rejectedCount },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      
      {/* Header bar navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="text-xs font-bold text-slate-555 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400 font-medium">Candidate Insights & Analytics</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6 flex-grow w-full">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-650" />
            Candidate AI Insights
          </h1>
          <p className="text-xs text-slate-550 mt-1">
            Analyze your credentials, verify resume performance charts, and review AI career development recommendations.
          </p>
        </div>

        {/* Stats Summary widgets row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <InsightStatCard title="Average ATS Match" value={`${candidate.ats_score || 80}%`} sub="Keywords suitability index" icon={Cpu} />
          <InsightStatCard title="AI Interview Rating" value={candidate.overall_score ? `${candidate.overall_score}/10` : 'Pending'} sub="Voice call assessment score" icon={Mic} />
          <InsightStatCard title="Active Submissions" value={`${totalCount}`} sub="Applications in pipeline" icon={Briefcase} />
        </div>

        {/* Charts Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Skill Performance Radar Chart */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Suitability Vector Dimensions
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                AI evaluation match values mapped across key profile assessment credentials
              </p>
            </div>

            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillDimensionsData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <Radar name="Candidacy Value" dataKey="Score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Applications by Status Bar Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-surface-150 p-6 shadow-card space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Applications distribution
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Active submissions sorted across workflow states
              </p>
            </div>

            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="Count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* AI Career & Resume Suggestions Panel */}
        <div className="bg-white rounded-2xl border border-surface-150 p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Actionable AI Suggestions & Profile Improvements
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Targeted recommendations to optimize ATS scoring and technical screening results
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Left Col: Skill Additions */}
            <div className="space-y-4 bg-slate-50/50 border border-slate-150 p-5 rounded-xl text-xs">
              <span className="font-extrabold text-brand-700 uppercase tracking-wide block">
                Skills Optimization Advice
              </span>

              {missingSkills.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-slate-600 leading-relaxed">
                    Based on job matching benchmarks for **{candidate.applied_role || 'developer positions'}**, we recommend expanding keyword experience in:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingSkills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-550 leading-relaxed">
                  Excellent! Your resume matches all essential requirements listed for this position description. 
                </p>
              )}
            </div>

            {/* Right Col: General Resume Advice */}
            <div className="space-y-3.5 text-xs">
              <span className="font-extrabold text-indigo-700 uppercase tracking-wide block">
                Resume Builder Checklists
              </span>

              <ul className="space-y-2.5 list-disc pl-4 text-slate-600 leading-relaxed">
                <li>
                  <span className="font-bold text-slate-800">Add Project Achievements:</span> List hands-on accomplishments using target keywords: {missingSkills.slice(0, 2).join(', ') || 'required tools'}.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Verbal Practice checks:</span> Review verbal transcripts and focus on structured, technical keyword answers during voice evaluations.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Verify format layouts:</span> Ensure contact details, social links, and chronological experiences align cleanly to optimize parsing efficiency.
                </li>
              </ul>
            </div>

          </div>
        </div>

      </main>

    </div>
  )
}

// Reusable stat card
const InsightStatCard = ({ title, value, sub, icon: Icon }) => (
  <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-card flex items-center justify-between gap-4">
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{title}</span>
      <span className="text-2xl font-black font-display text-slate-900 block leading-none">{value}</span>
      <span className="text-[10px] text-slate-400 block">{sub}</span>
    </div>
    <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100 flex-shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  </div>
)

export default CandidateInsightsPage
