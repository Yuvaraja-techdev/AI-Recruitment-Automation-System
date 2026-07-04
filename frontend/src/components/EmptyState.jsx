import { HelpCircle } from 'lucide-react'

const EmptyState = ({ message = 'No data found', subtitle = 'Try adjusting your filters or search query.' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in w-full">
      <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 mb-4 border border-surface-200 border-dashed">
        <HelpCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-surface-800">{message}</h3>
      <p className="text-xs text-surface-500 mt-1 max-w-xs leading-relaxed">{subtitle}</p>
    </div>
  )
}

export default EmptyState
