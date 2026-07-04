import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Camera,
  Mic,
  Cpu,
  Wifi,
  WifiOff,
  VideoOff,
  MicOff,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Volume2,
} from 'lucide-react'
import { getCandidateById } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorState from '../components/ErrorState'

const SystemCheck = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Hardware states
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Diagnostics states
  const [cameraActive, setCameraActive] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [browserCompatible, setBrowserCompatible] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [permissionError, setPermissionError] = useState(null)

  // Hardware stream references
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const volumeMeterRef = useRef(null)
  const animationFrameRef = useRef(null)
  const audioContextRef = useRef(null)

  // Interactive Voice Playback Test states
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [testAudioUrl, setTestAudioUrl] = useState(null)
  const [isPlayingTest, setIsPlayingTest] = useState(false)
  const [testCountdown, setTestCountdown] = useState(3)
  
  const testRecorderRef = useRef(null)
  const testChunksRef = useRef([])
  const testIntervalRef = useRef(null)
  const testAudioRef = useRef(null)

  // Fetch candidate info on mount
  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true)
        const data = await getCandidateById(id)
        setCandidate(data)
      } catch (err) {
        console.error(err)
        setError('Verification failed. Unable to fetch interview context.')
      } finally {
        setLoading(false)
      }
    }
    loadCandidate()
  }, [id])

  // Browser Compatibility check
  useEffect(() => {
    const isCompatible = !!(navigator.mediaDevices && window.MediaRecorder)
    setBrowserCompatible(isCompatible)
  }, [])

  // Online status event listeners
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize WebRTC Stream & Audio Context
  const startSystemCheck = async () => {
    setPermissionError(null)
    try {
      // 1. Request video & audio access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      })

      streamRef.current = stream

      // 2. Setup video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)

      // 3. Setup microphone monitoring (Web Audio API)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      setMicActive(true)

      // High performance animation loop updates direct DOM to bypass React render cycle
      const updateVolumeMeter = () => {
        if (!analyser || !volumeMeterRef.current) return
        analyser.getByteFrequencyData(dataArray)

        // Calculate average volume peak
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        const volumePercentage = Math.min((average / 128) * 100, 100)

        // Direct DOM update for 60fps responsiveness
        if (volumeMeterRef.current) {
          volumeMeterRef.current.style.width = `${volumePercentage}%`
        }

        animationFrameRef.current = requestAnimationFrame(updateVolumeMeter)
      }

      updateVolumeMeter()
    } catch (err) {
      console.error('Device access denied or failed:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Access blocked. Please click the camera icon in your address bar and allow media permissions.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('Hardware not found. Please connect a working camera and microphone.')
      } else {
        setPermissionError(err.message || 'Failed to initialize system devices.')
      }
      setCameraActive(false)
      setMicActive(false)
    }
  }

  // Auto start checks when candidate is loaded
  useEffect(() => {
    if (candidate) {
      startSystemCheck()
    }
    
    // Cleanup streams on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current)
      }
      if (testAudioRef.current) {
        testAudioRef.current.pause()
      }
    }
  }, [candidate])

  const startVoiceTest = async () => {
    if (!streamRef.current) {
      alert("Please allow camera and microphone access first.")
      return
    }

    try {
      testChunksRef.current = []
      setTestAudioUrl(null)
      setIsPlayingTest(false)
      if (testAudioRef.current) {
        testAudioRef.current.pause()
      }

      const audioTracks = streamRef.current.getAudioTracks()
      if (audioTracks.length === 0) {
        alert("No audio track available. Please check your microphone connection.")
        return
      }

      const audioStream = new MediaStream(audioTracks)

      let options = { mimeType: 'audio/webm' }
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' }
        if (!MediaRecorder.isTypeSupported('audio/ogg')) {
          options = {}
        }
      }

      const recorder = new MediaRecorder(audioStream, options)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          testChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(testChunksRef.current, {
          type: options.mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        setTestAudioUrl(url)
        setIsTestingMic(false)
      }

      testRecorderRef.current = recorder
      recorder.start()
      setIsTestingMic(true)
      setTestCountdown(3)

      let count = 3
      testIntervalRef.current = setInterval(() => {
        count -= 1
        setTestCountdown(count)
        if (count <= 0) {
          clearInterval(testIntervalRef.current)
          if (testRecorderRef.current && testRecorderRef.current.state !== 'inactive') {
            testRecorderRef.current.stop()
          }
        }
      }, 1000)

    } catch (err) {
      console.error("Failed to start voice test:", err)
      alert("Error starting voice recorder test.")
    }
  }

  const playVoiceTest = () => {
    if (!testAudioUrl) return

    if (testAudioRef.current) {
      testAudioRef.current.pause()
    }

    const audio = new Audio(testAudioUrl)
    testAudioRef.current = audio
    setIsPlayingTest(true)
    audio.play()

    audio.onended = () => {
      setIsPlayingTest(false)
    }

    audio.onerror = () => {
      setIsPlayingTest(false)
    }
  }

  const handleProceed = () => {
    // Proceed to actual Voice Interview Simulator room (Module 5 path)
    navigate(`/interview/${id}/room`)
  }

  const allChecksPassed = cameraActive && micActive && browserCompatible && online

  if (loading) return <LoadingSpinner message="Validating session metadata..." />
  if (error) return <ErrorState message={error} onRetry={() => navigate('/interview')} />

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-card border border-surface-150 overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-500 to-indigo-600" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-surface-100">
            <button
              onClick={() => navigate(`/interview/${id}`)}
              className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-surface-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold font-display text-surface-900">
                System Readiness Check
              </h1>
              <p className="text-xs text-surface-500">
                Verify your video, sound inputs, and network requirements before proceeding.
              </p>
            </div>
          </div>

          {permissionError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 font-display">Permissions Required</p>
                <p className="text-xs text-amber-650 mt-0.5">{permissionError}</p>
                <button
                  onClick={startSystemCheck}
                  className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 underline"
                >
                  Retry Device Access
                </button>
              </div>
            </div>
          )}

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Preview Column */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                Video Feed Preview
              </h3>
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-surface-200 flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <VideoOff className="w-8 h-8 text-slate-650 mx-auto" />
                    <p className="text-xs text-slate-500">Camera stream offline</p>
                  </div>
                )}
                
                {/* Floating indicator */}
                <div className="absolute bottom-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-[10px] text-white font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {cameraActive ? 'Camera Connected' : 'No Video'}
                </div>
              </div>
              
              {/* Mic level visualizer */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wide text-surface-400">
                  <span>Microphone Activity</span>
                  <span>{micActive ? 'Active' : 'Offline'}</span>
                </div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden border border-surface-150">
                  <div
                    ref={volumeMeterRef}
                    className="h-full w-0 bg-brand-500 transition-[width] duration-75 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Checklist Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                Diagnostics Checklist
              </h3>

              <div className="space-y-3">
                <ChecklistCard
                  icon={Camera}
                  title="Webcam Status"
                  description="Ensures recruiter can capture video evidence."
                  status={cameraActive ? 'success' : 'pending'}
                />

                <ChecklistCard
                  icon={Mic}
                  title="Microphone Status"
                  description="Captures audio answers for voice transcripts."
                  status={micActive ? 'success' : 'pending'}
                />

                <ChecklistCard
                  icon={Cpu}
                  title="Browser Compatibility"
                  description="Ensures browser supports audio recording."
                  status={browserCompatible ? 'success' : 'fail'}
                />

                <ChecklistCard
                  icon={online ? Wifi : WifiOff}
                  title="Internet Connection"
                  description="Connects your browser to our assessment APIs."
                  status={online ? 'success' : 'fail'}
                />
              </div>

              {/* Voice Playback Quality Test Card */}
              {micActive && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-4 animate-scale-up">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-brand-600 animate-pulse" />
                      <h4 className="text-xs font-bold text-surface-850">Interactive Voice Quality Check</h4>
                    </div>
                    {testAudioUrl && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-mono animate-scale-up">
                        Audio Recorded
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-surface-500 leading-normal">
                    Let's verify that your speech is clear. Click below to record a short 3-second sample, and play it back to check the quality.
                  </p>

                  <div className="flex items-center gap-3">
                    {!isTestingMic ? (
                      <button
                        type="button"
                        onClick={startVoiceTest}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
                      >
                        <Mic className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        Record Test Audio
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-ping mr-1" />
                        Speaking... ({testCountdown}s)
                      </button>
                    )}

                    {testAudioUrl && (
                      <button
                        type="button"
                        onClick={playVoiceTest}
                        disabled={isTestingMic}
                        className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all ${
                          isPlayingTest 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 animate-pulse' 
                            : 'bg-brand-600 hover:bg-brand-700 text-white'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        {isPlayingTest ? 'Playing back...' : 'Play Back Recording'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Permissions are released as soon as the tab is closed.
            </div>

            <button
              onClick={handleProceed}
              disabled={!allChecksPassed}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
                allChecksPassed
                  ? 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-md hover:shadow-brand-600/10 active:scale-[0.98]'
                  : 'bg-surface-200 text-surface-400 cursor-not-allowed'
              }`}
            >
              Proceed to Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Checklist row item component
const ChecklistCard = ({ icon: Icon, title, description, status }) => {
  const isSuccess = status === 'success'
  const isFail = status === 'fail'

  return (
    <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
      isSuccess 
        ? 'bg-emerald-50/20 border-emerald-100' 
        : isFail 
        ? 'bg-red-50/20 border-red-100' 
        : 'bg-surface-50 border-surface-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 border ${
          isSuccess 
            ? 'bg-white text-emerald-600 border-emerald-100 shadow-sm' 
            : isFail 
            ? 'bg-white text-red-500 border-red-100 shadow-sm' 
            : 'bg-white text-surface-400 border-surface-200'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-surface-850">{title}</h4>
          <p className="text-[10px] text-surface-500 leading-relaxed">{description}</p>
        </div>
      </div>

      <div>
        {isSuccess ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Active
          </span>
        ) : isFail ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 animate-pulse">
            Failed
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
            Pending
          </span>
        )}
      </div>
    </div>
  )
}

export default SystemCheck
