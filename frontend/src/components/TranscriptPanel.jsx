import React from 'react'
import { FileText, Cpu, CheckCircle } from 'lucide-react'

function TranscriptPanel({ transcript, isTranscribing }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card h-full flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">Answer Transcript</h3>
          </div>
          
          {transcript && !isTranscribing && (
            <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Transcribed</span>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="min-h-[100px] flex flex-col justify-center">
          {isTranscribing ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></span>
              </div>
              <p className="text-xs text-brand-650 font-semibold flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Faster Whisper transcribing audio...
              </p>
            </div>
          ) : transcript ? (
            <p className="text-xs text-surface-700 leading-relaxed italic bg-surface-50 p-4 rounded-xl border border-surface-150 font-mono">
              "{transcript}"
            </p>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-surface-400 leading-normal max-w-xs mx-auto">
                Press the microphone button, record your answer verbally, then click "Submit Answer".
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-[10px] text-surface-400 font-medium mt-4 pt-3 border-t border-surface-100 flex justify-between">
        <span>Offline STT Engine</span>
        <span>Faster-Whisper (tiny-int8)</span>
      </div>
    </div>
  )
}

export default TranscriptPanel
