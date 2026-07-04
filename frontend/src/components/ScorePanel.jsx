import React from 'react'
import { Award, Sparkles, MessageSquare } from 'lucide-react'

function ScorePanel({ evaluation, isEvaluating }) {
  if (isEvaluating) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card h-full flex flex-col items-center justify-center min-h-[220px]">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin"></div>
          <Sparkles className="w-5 h-5 text-brand-600 absolute animate-pulse" />
        </div>
        <p className="text-xs font-bold text-brand-650 mt-4 uppercase tracking-wider">AI grading response...</p>
        <p className="text-[10px] text-surface-400 mt-1">Analyzing correctness, reasoning and communication</p>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card h-full flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="w-10 h-10 bg-surface-50 rounded-xl flex items-center justify-center border border-surface-150 mb-3">
          <Award className="w-5 h-5 text-brand-500" />
        </div>
        <p className="text-xs text-surface-400 max-w-xs leading-normal">
          Scores and evaluation feedback will appear here after you submit your answer.
        </p>
      </div>
    )
  }

  const { 
    technical_score, 
    communication_score, 
    confidence_score, 
    problem_solving_score, 
    relevance_score, 
    completeness_score, 
    feedback 
  } = evaluation

  // Helper to color-code scores
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-emerald-600 bg-emerald-500'
    if (score >= 5) return 'from-brand-500 to-brand-600 bg-brand-600'
    return 'from-rose-500 to-rose-600 bg-rose-500'
  }

  const criteria = [
    { label: 'Technical Knowledge', value: technical_score || 0 },
    { label: 'Communication', value: communication_score || 0 },
    { label: 'Confidence', value: confidence_score || 0 },
    { label: 'Problem Solving', value: problem_solving_score || 0 },
    { label: 'Relevance', value: relevance_score || 0 },
    { label: 'Completeness', value: completeness_score || 0 },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card h-full flex flex-col justify-between space-y-4">
      <div>
        {/* Panel Header */}
        <div className="flex items-center gap-2 border-b border-surface-100 pb-3 mb-4">
          <Award className="w-4 h-4 text-brand-650" />
          <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">Evaluation Grades</h3>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {criteria.map((item, index) => (
            <div key={index} className="bg-surface-50 border border-surface-150 p-3 rounded-xl relative overflow-hidden">
              <span className="text-[10px] font-bold text-surface-500 uppercase block mb-1 truncate">
                {item.label}
              </span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-extrabold text-surface-950">{item.value}</span>
                <span className="text-[9px] text-surface-400 font-bold">/10</span>
              </div>
              
              <div className="w-full bg-surface-200 rounded-full h-1 mt-2 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${getScoreColor(item.value)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${item.value * 10}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Qualitative Feedback */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
            AI Interviewer Feedback
          </span>
          <p className="text-xs text-surface-700 leading-relaxed bg-brand-50/20 border border-brand-100 p-3 rounded-xl italic">
            "{feedback}"
          </p>
        </div>
      </div>

      <div className="text-[10px] text-surface-400 font-medium pt-3 border-t border-surface-100 flex justify-between">
        <span>Evaluated by Gemini</span>
        <span>Standard Criteria Engine</span>
      </div>
    </div>
  )
}

export default ScorePanel
