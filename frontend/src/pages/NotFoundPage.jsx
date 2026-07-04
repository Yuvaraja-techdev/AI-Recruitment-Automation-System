import { Link } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-6 shadow-sm border border-brand-100">
        <FileQuestion className="w-8 h-8" strokeWidth={1.8} />
      </div>
      <h1 className="text-4xl font-extrabold font-display text-surface-900 tracking-tight mb-2">
        404 Page Not Found
      </h1>
      <p className="text-sm text-surface-500 max-w-md mb-8 leading-relaxed">
        We couldn't locate the candidate review or dashboard view you are trying to reach. Check the address or return back to home.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white shadow-sm shadow-brand-600/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}

export default NotFoundPage
