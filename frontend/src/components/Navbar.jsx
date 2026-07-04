import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'

const Navbar = ({ sidebarCollapsed, onMenuClick }) => {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/recruiter/candidates?search=${encodeURIComponent(searchValue.trim())}`)
    } else {
      navigate('/recruiter/candidates')
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200 z-30 flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      {/* Left — Mobile Menu + Search */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" strokeWidth={2} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search candidates..."
            className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
            id="global-search"
          />
        </form>
      </div>

      {/* Right — Notifications + Profile */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2.5 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          aria-label="Notifications"
          id="notification-btn"
        >
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="w-px h-8 bg-surface-200" />

        <button 
          onClick={() => {
            import('../services/api').then((api) => {
              api.logout()
              navigate('/login')
            })
          }}
          className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors" 
          id="profile-btn"
          title="Click to Log Out"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            R
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-surface-850 leading-tight">Log Out</p>
            <p className="text-[11px] text-surface-400 leading-tight">Recruiter Admin</p>
          </div>
        </button>
      </div>
    </header>
  )
}

export default Navbar
