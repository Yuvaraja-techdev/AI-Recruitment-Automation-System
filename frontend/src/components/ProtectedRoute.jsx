import React from 'react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const userString = localStorage.getItem('user')
  
  if (!token || !userString) {
    // Clear potentially corrupted local states
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(userString)
    
    // Check if the current user role matches allowed roles for this route
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'CANDIDATE') {
        // Candidates trying to access recruiter paths are bounced back to landing page
        return <Navigate to="/" replace />
      } else {
        // Recruiters trying to access candidate paths are redirected to dashboard
        return <Navigate to="/recruiter" replace />
      }
    }
  } catch (e) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
