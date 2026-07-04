import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function Timer({ isActive }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2 text-sm font-semibold shadow-inner">
      <Clock className="w-4 h-4 text-indigo-400 animate-pulse-slow" />
      <span className="text-slate-300 font-mono tracking-widest">{formatTime(seconds)}</span>
    </div>
  )
}

export default Timer
