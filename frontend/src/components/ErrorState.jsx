import { AlertTriangle, RefreshCw } from 'lucide-react'

const ErrorState = ({ message = 'Something went wrong', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="p-4 rounded-2xl bg-red-50 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.8} />
      </div>
      <p className="text-sm font-semibold text-surface-800 mb-1">Failed to load data</p>
      <p className="text-sm text-surface-500 mb-4 max-w-xs text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={2} />
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorState
