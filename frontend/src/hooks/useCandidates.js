import { useState, useEffect, useCallback } from 'react'
import { getAllCandidates, deleteCandidate } from '../services/api'

/**
 * Custom hook to fetch and manage candidate data.
 * Provides candidates list, loading/error state, computed statistics, and delete method.
 */
const useCandidates = () => {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllCandidates()
      setCandidates(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const removeCandidate = useCallback(async (candidateId) => {
    const previousCandidates = candidates
    setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId))

    try {
      await deleteCandidate(candidateId)
    } catch (err) {
      setCandidates(previousCandidates)
      throw err
    }
  }, [candidates])

  // Computed statistics
  const stats = {
    total: candidates.length,
    selected: candidates.filter(c => c.status?.toUpperCase() === 'SELECTED').length,
    rejected: candidates.filter(c => c.status?.toUpperCase() === 'REJECTED').length,
    pending: candidates.filter(c => c.status?.toUpperCase() === 'PENDING').length,
  }

  return { candidates, loading, error, stats, refetch: fetchCandidates, removeCandidate }
}

export default useCandidates
