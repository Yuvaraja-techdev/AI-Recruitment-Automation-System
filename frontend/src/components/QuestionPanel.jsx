import React from 'react'
import { Terminal, HelpCircle } from 'lucide-react'

function QuestionPanel({ question, questionNumber, totalQuestions = 5 }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card relative overflow-hidden h-full flex flex-col justify-between">
      {/* Decorative accent top right */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl"></div>

      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 rounded-full text-xs font-semibold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Technical Assessment</span>
          </div>
          
          <span className="text-xs font-semibold text-surface-400 tracking-wider">
            QUESTION <span className="text-brand-600 font-bold">{questionNumber}</span> OF {totalQuestions}
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-brand-600 mt-1 flex-shrink-0" />
            <h3 className="text-base font-bold text-surface-900 leading-relaxed font-display">
              {question || "Preparing the first question for your interview..."}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-surface-100 pt-4 flex justify-between items-center text-xs text-surface-400">
        <span className="flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mr-2"></span>
          Tailored to your skills profile
        </span>
        <span className="font-mono text-brand-650/80">Gemini Engine</span>
      </div>
    </div>
  )
}

export default QuestionPanel
