import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  ArrowLeft, 
  FileText, 
  Search, 
  BrainCircuit, 
  Calendar, 
  Gift, 
  Sparkles 
} from 'lucide-react'

function ApplicationSuccessPage() {
  const navigate = useNavigate()

  const timelineStages = [
    {
      title: 'Resume Uploaded',
      status: 'completed', // completed | current | upcoming
      description: 'Your application payload and PDF resume have been successfully transmitted.',
      icon: FileText,
      date: 'Just now'
    },
    {
      title: 'ATS Screening',
      status: 'current',
      description: 'Our Automated Tracking System is parsing your resume and aligning skills with the position.',
      icon: Search,
      date: 'In progress'
    },
    {
      title: 'AI Evaluation',
      status: 'upcoming',
      description: 'Dynamic matching engine calculates suitability and triggers question generation.',
      icon: BrainCircuit,
      date: 'Upcoming'
    },
    {
      title: 'Interview',
      status: 'upcoming',
      description: 'Personalized interactive chat or live technical scheduler session.',
      icon: Calendar,
      date: 'Upcoming'
    },
    {
      title: 'Offer',
      status: 'upcoming',
      description: 'Final review by the recruitment board and formal proposal drafting.',
      icon: Gift,
      date: 'Upcoming'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/jobs" className="text-xs font-bold text-slate-550 flex items-center gap-1 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Submission Success
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* Success Banner */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border-4 border-emerald-100 shadow-sm animate-scale-up">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-surface-900 tracking-tight font-display">
              Application Submitted Successfully!
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your application has been received and has entered the candidate review cycle. You can follow the current screening timeline below.
            </p>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="w-full bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl -z-10" />
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              <h3 className="text-xs font-extrabold text-surface-900 uppercase tracking-wider">
                Recruitment Timeline
              </h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Live Pipeline
            </span>
          </div>

          <div className="space-y-6 relative">
            {timelineStages.map((stage, idx) => {
              const IconComp = stage.icon
              const isLast = idx === timelineStages.length - 1
              
              let statusBorderColor = 'border-slate-150'
              let statusBgColor = 'bg-slate-50 text-slate-400'
              let statusTextColor = 'text-slate-500'
              let lineStyle = 'border-slate-150'
              
              if (stage.status === 'completed') {
                statusBorderColor = 'border-emerald-200'
                statusBgColor = 'bg-emerald-50 text-emerald-550'
                statusTextColor = 'text-slate-800'
                lineStyle = 'border-emerald-250'
              } else if (stage.status === 'current') {
                statusBorderColor = 'border-brand-300'
                statusBgColor = 'bg-brand-50 text-brand-600 animate-pulse'
                statusTextColor = 'text-slate-900 font-bold'
                lineStyle = 'border-slate-200 border-dashed'
              }

              return (
                <div key={idx} className="flex gap-4 relative">
                  {/* Left line connection */}
                  {!isLast && (
                    <div className={`absolute left-5 top-10 bottom-[-24px] w-0.5 border-l-2 ${lineStyle}`} />
                  )}

                  {/* Icon step bubble */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusBorderColor} ${statusBgColor} flex-shrink-0 z-10 shadow-sm`}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Text details */}
                  <div className="flex-grow space-y-1 mt-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${statusTextColor} font-display`}>
                        {stage.title}
                      </h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                        stage.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : stage.status === 'current' 
                            ? 'bg-brand-50 text-brand-700' 
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {stage.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                      {stage.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => navigate('/jobs')}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Board
          </button>
        </div>

      </main>
    </div>
  )
}

export default ApplicationSuccessPage
