/**
 * StatusBadge — Reusable color-coded status badge.
 * Supports: SELECTED (green), REJECTED (red), PENDING (amber)
 */
const StatusBadge = ({ status }) => {
  const normalized = status?.toUpperCase()
  let className = 'badge '

  if (normalized === 'SELECTED') className += 'badge-selected'
  else if (normalized === 'REJECTED') className += 'badge-rejected'
  else if (normalized === 'SCREENED') className += 'badge-screened'
  else if (normalized === 'INTERVIEWING') className += 'badge-interviewing'
  else className += 'badge-pending'

  return <span className={className}>{status}</span>
}

export default StatusBadge
