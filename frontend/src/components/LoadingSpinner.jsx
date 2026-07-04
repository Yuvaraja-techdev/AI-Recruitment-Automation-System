import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" strokeWidth={2} />
      <p className="mt-3 text-sm text-surface-500 font-medium">{message}</p>
    </div>
  )
}

export default LoadingSpinner
