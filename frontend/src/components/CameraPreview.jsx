import React, { useEffect, useRef, useState } from 'react'
import { Video, VideoOff, Mic, MicOff, AlertCircle } from 'lucide-react'

function CameraPreview({ isRecording }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [hasPermissions, setHasPermissions] = useState(null) // null=checking, true=granted, false=denied
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function enableStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        setHasPermissions(true)
      } catch (err) {
        console.error("Camera/Mic access denied:", err)
        setHasPermissions(false)
        setErrorMsg(err.message || 'Permission denied or devices not found.')
      }
    }

    enableStream()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="glass rounded-3xl overflow-hidden relative border border-slate-900 shadow-xl aspect-video w-full">
      {hasPermissions === true ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]" // mirror view
          />
          
          {/* Overlay Status */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-800">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Mic Active</span>
            </div>
            
            {isRecording && (
              <div className="flex items-center space-x-1.5 bg-red-950/90 border border-red-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-red-200 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Recording Answer...</span>
              </div>
            )}
          </div>
        </>
      ) : hasPermissions === false ? (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Media Permissions Required</h3>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
            Please allow access to your camera and microphone in the browser settings to continue.
          </p>
          <span className="text-[10px] text-red-500 font-mono mt-3 uppercase tracking-wide bg-red-950/30 px-2 py-0.5 rounded border border-red-500/10">
            {errorMsg}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-400 mt-3 font-semibold">Requesting media access...</span>
        </div>
      )}

      {/* Camera feed placeholder grid */}
      {hasPermissions === true && (
        <div className="absolute top-4 right-4 flex items-center bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-800">
          <Video className="w-3.5 h-3.5 text-indigo-400" />
        </div>
      )}
    </div>
  )
}

export default CameraPreview
