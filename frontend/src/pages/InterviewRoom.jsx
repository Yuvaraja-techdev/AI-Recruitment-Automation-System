import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  ArrowRight,
  XCircle,
  Award,
  UserCheck,
  AlertTriangle,
  UserX,
  RotateCcw,
  Clock,
  Sparkles,
  ListRestart,
  BookOpen,
} from 'lucide-react'
import {
  getCandidateById,
  startInterview,
  transcribeAudio,
  evaluateAnswer,
  nextQuestion,
  endInterview,
} from '../services/api.js'
import CameraPreview from '../components/CameraPreview.jsx'
import Timer from '../components/Timer.jsx'
import QuestionPanel from '../components/QuestionPanel.jsx'
import TranscriptPanel from '../components/TranscriptPanel.jsx'
import ScorePanel from '../components/ScorePanel.jsx'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

function InterviewRoom() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Routing states
  const [step, setStep] = useState('loading') // 'loading' | 'interview' | 'ended'
  const [candidate, setCandidate] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Active Question Info
  const [sessionId, setSessionId] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions] = useState(5)

  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const recorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  // API Call progress
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  // Question Response Data
  const [transcript, setTranscript] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [history, setHistory] = useState([]) // full conversation logs

  // Final Summary
  const [summary, setSummary] = useState(null)

  // Fetch candidate details and auto-start interview session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setError('')
        const candidateData = await getCandidateById(id)
        setCandidate(candidateData)

        // Auto start interview session with candidate details
        const sessionData = await startInterview(
          candidateData.name,
          candidateData.applied_role,
          candidateData.resume,
          candidateData.candidate_id
        )

        setSessionId(sessionData.session_id)
        setCurrentQuestion(sessionData.first_question)
        setStep('interview')
      } catch (err) {
        console.error(err)
        setError(
          'Failed to initialize interview. Please verify your connection and that the API server is online.'
        )
        setStep('loading')
      }
    }

    if (id) {
      initializeSession()
    }
  }, [id])

  // Cleanup audio tracks on unmount to prevent resource leaks
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Audio Capture Actions
  const handleStartRecording = async () => {
    try {
      audioChunksRef.current = []
      setAudioBlob(null)
      setTranscript('')
      setEvaluation(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let options = { mimeType: 'audio/webm' }
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' }
        if (!MediaRecorder.isTypeSupported('audio/ogg')) {
          options = {}
        }
      }

      const recorder = new MediaRecorder(stream, options)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }
      recorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, {
          type: options.mimeType || 'audio/webm',
        })
        setAudioBlob(recordedBlob)
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      recorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access failed:', err)
      alert('Microphone access failed. Please enable browser permissions.')
    }
  }

  const handleStopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Submits audio to Whisper, then transcript to Gemini
  const handleSubmitAnswer = async () => {
    if (!audioBlob || !candidate) return
    setIsTranscribing(true)
    setError('')

    try {
      // Step A: Transcribe audio using backend Whisper API
      const transData = await transcribeAudio(audioBlob)
      const text = transData.transcript || '[Silent / No Speech Detected]'
      setTranscript(text)
      setIsTranscribing(false)

      // Step B: Grade answer using Gemini
      setIsEvaluating(true)
      const evalData = await evaluateAnswer(
        currentQuestion,
        text,
        candidate.applied_role,
        candidate.resume,
        sessionId
      )
      setEvaluation(evalData)

      // Update local history preview
      setHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: text,
          scores: evalData,
        },
      ])
    } catch (err) {
      console.error(err)
      setError('An error occurred during submission. Check if backend services are configured.')
      setIsTranscribing(false)
    } finally {
      setIsEvaluating(false)
    }
  }

  // Advances to next question
  const handleNextQuestion = async () => {
    if (questionNumber >= totalQuestions) {
      handleEndInterview()
      return
    }

    setIsLoading(true)
    try {
      const data = await nextQuestion(sessionId)
      if (data.is_finished) {
        handleEndInterview()
      } else {
        setCurrentQuestion(data.next_question)
        setQuestionNumber(data.question_number)
        // Reset answer states
        setTranscript('')
        setEvaluation(null)
        setAudioBlob(null)
      }
    } catch (err) {
      console.error(err)
      alert('Error fetching next question.')
    } finally {
      setIsLoading(false)
    }
  }

  // Ends interview and compiles report card
  const handleEndInterview = async () => {
    setIsEnding(true)
    setError('')
    try {
      const data = await endInterview(sessionId)
      setSummary(data)
      setStep('ended')
    } catch (err) {
      console.error(err)
      setError('Failed to compile final interview evaluation review summary.')
    } finally {
      setIsEnding(false)
    }
  }

  // Reset/Restart session back to portal checklist
  const handleRestart = () => {
    navigate(`/interview/${id}`)
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
        {error ? (
          <ErrorState message={error} onRetry={() => navigate(`/interview/${id}`)} />
        ) : (
          <LoadingSpinner message="Starting interview workspace..." />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {error && (
        <div className="max-w-7xl mx-auto w-full bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3.5 rounded-xl mb-6 flex items-center justify-between shadow-sm animate-shake">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ACTIVE INTERVIEW ROOM */}
      {step === 'interview' && (
        <div className="max-w-7xl mx-auto w-full space-y-6">
          
          {/* Header Panel */}
          <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-wider">
                Live Assessment
              </span>
              <h2 className="text-xl font-bold font-display text-surface-900 mt-1">
                {candidate?.name}
              </h2>
              <p className="text-xs text-surface-500">
                Applied for:{' '}
                <span className="font-semibold text-surface-700">{candidate?.applied_role}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Timer isActive={true} />

              <button
                onClick={handleEndInterview}
                disabled={isEnding}
                className="bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-red-100"
              >
                <XCircle className="w-4 h-4" />
                {isEnding ? 'Concluding...' : 'End Interview'}
              </button>
            </div>
          </div>

          {/* Grid Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column - Video Feed & Microphone Commands */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {/* Webcam preview component */}
              <CameraPreview isRecording={isRecording} />

              {/* Controls Box */}
              <div className="bg-white rounded-2xl p-6 border border-surface-150 shadow-card flex flex-col justify-between flex-1 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    Recording Controls
                  </h3>
                  <p className="text-xs text-surface-500 leading-relaxed">
                    Read the question on the right side. When ready, click **Record Answer** to speak. Click **Stop** when finished, then submit it for AI evaluation.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Record Trigger Button */}
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      disabled={isTranscribing || isEvaluating}
                      className="bg-surface-50 hover:bg-surface-100 text-surface-800 border border-surface-200 py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                    >
                      <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                      <span>Record Answer</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all animate-pulse shadow-sm shadow-red-200"
                    >
                      <MicOff className="w-4 h-4 text-white" />
                      <span>Stop Recording</span>
                    </button>
                  )}

                  {/* Submit Answer Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!audioBlob || isRecording || isTranscribing || isEvaluating}
                    className="bg-brand-600 hover:bg-brand-700 disabled:bg-surface-100 disabled:text-surface-400 disabled:border-transparent disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm shadow-brand-600/10"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Answer</span>
                  </button>
                </div>

                {/* Next Question / Continue Command */}
                <button
                  onClick={handleNextQuestion}
                  disabled={!evaluation || isRecording || isTranscribing || isEvaluating || isLoading}
                  className="w-full bg-surface-900 hover:bg-surface-850 disabled:bg-surface-100 disabled:text-surface-400 disabled:opacity-50 text-white py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
                >
                  {isLoading ? (
                    <span>Generating Next Question...</span>
                  ) : (
                    <>
                      <span>
                        {questionNumber >= totalQuestions ? 'Finish & Compile Review' : 'Next Question'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Gemini Question, Transcript & Grades */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              <div className="h-1/3 min-h-[140px]">
                <QuestionPanel question={currentQuestion} questionNumber={questionNumber} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="min-h-[220px]">
                  <TranscriptPanel transcript={transcript} isTranscribing={isTranscribing} />
                </div>
                <div className="min-h-[220px]">
                  <ScorePanel evaluation={evaluation} isEvaluating={isEvaluating} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT SUMMARY CARD */}
      {step === 'ended' && summary && (
        <div className="max-w-4xl w-full mx-auto space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-surface-150 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-indigo-600" />

            <div className="space-y-6">
              {/* Header decision */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-surface-100 pb-6 gap-4">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-wider mb-2">
                    Interview Concluded
                  </span>
                  <h2 className="text-2xl font-bold font-display text-surface-900">
                    {candidate?.name}
                  </h2>
                  <p className="text-xs text-surface-500">
                    Applied role:{' '}
                    <span className="font-semibold text-surface-700">{candidate?.applied_role}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rating score badge */}
                  <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block">
                      Overall Rating
                    </span>
                    <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                      <span className="text-2xl font-black text-brand-600">
                        {summary.overall_score}
                      </span>
                      <span className="text-[10px] text-surface-400 font-bold">/10</span>
                    </div>
                  </div>

                  {/* Hiring decision recommendations */}
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider block mb-1">
                      Hiring Verdict
                    </span>
                    {summary.recommendation === 'Selected' && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-50">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>SELECTED</span>
                      </div>
                    )}
                    {summary.recommendation === 'Hold' && (
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-amber-50">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>HOLD</span>
                      </div>
                    )}
                    {summary.recommendation === 'Rejected' && (
                      <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-red-50">
                        <UserX className="w-4 h-4 text-red-650" />
                        <span>REJECTED</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary card */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brand-600" />
                  Performance Evaluation Summary
                </h3>
                <div className="bg-gradient-to-br from-surface-50 to-brand-50/20 rounded-xl p-5 border border-surface-150">
                  <p className="text-xs text-surface-700 leading-relaxed whitespace-pre-wrap">
                    {summary.summary}
                  </p>
                </div>
              </div>

              {/* Historical response logs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Detailed Response Log
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {history.map((turn, index) => (
                    <div
                      key={index}
                      className="bg-white border border-surface-200 rounded-xl p-4 space-y-2.5 shadow-sm hover:border-surface-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-650 font-mono">
                          QUESTION {index + 1}
                        </span>
                        <div className="flex gap-2 text-[10px] font-bold uppercase">
                          <span className="bg-surface-50 border border-surface-200 px-2 py-0.5 rounded text-surface-500">
                            Tech: {turn.scores?.technical_score}/10
                          </span>
                          <span className="bg-surface-50 border border-surface-200 px-2 py-0.5 rounded text-surface-500">
                            Comm: {turn.scores?.communication_score}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="text-surface-900 font-semibold leading-relaxed">
                          <span className="text-surface-400 font-bold mr-1">Q:</span>
                          {turn.question}
                        </p>
                        <p className="text-surface-600 italic leading-relaxed pl-2 border-l border-surface-200">
                          <span className="text-surface-400 font-bold mr-1 not-italic">A:</span>
                          "{turn.answer}"
                        </p>
                        <div className="bg-brand-50/20 text-brand-700 p-2.5 rounded-lg border border-brand-100 mt-2 text-[11px] leading-relaxed">
                          <span className="font-bold mr-1 text-brand-800">AI Feedback:</span>
                          {turn.scores?.feedback}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action resets */}
              <div className="pt-6 border-t border-surface-100 flex justify-end gap-3">
                <button
                  onClick={handleRestart}
                  className="bg-surface-50 hover:bg-surface-100 text-surface-700 border border-surface-200 font-semibold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 text-xs shadow-sm shadow-surface-100"
                >
                  <ListRestart className="w-4 h-4" />
                  <span>Restart Assessment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewRoom
