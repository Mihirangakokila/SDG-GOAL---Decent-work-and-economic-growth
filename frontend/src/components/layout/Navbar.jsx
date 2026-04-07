import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Briefcase, Menu, X, ChevronDown,
  LayoutDashboard, LogOut, User, PlusCircle, Search
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, isOrg } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-display font-bold text-xl text-navy-900">
              Intern<span className="text-brand">Hub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/internships"
              className={({ isActive }) =>
                `nav-link px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'text-brand active' : 'text-slate-600 hover:text-navy-900'
                }`}
            >
              Browse Jobs
            </NavLink>
            {!user && (
              <NavLink to="/for-organizations"
                className={({ isActive }) =>
                  `nav-link px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-brand active' : 'text-slate-600 hover:text-navy-900'
                  }`}
              >
                For Organizations
              </NavLink>
            )}
            {isOrg && (
              <>
                <NavLink to="/dashboard"
                  className={({ isActive }) =>
                    `nav-link px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand active' : 'text-slate-600 hover:text-navy-900'
                    }`}
                >
                  Dashboard
                </NavLink>
                <NavLink to="/dashboard/post"
                  className={({ isActive }) =>
                    `nav-link px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand active' : 'text-slate-600 hover:text-navy-900'
                    }`}
                >
                  Post Internship
                </NavLink>
              </>
            )}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login"    className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand">
                      {(user.organizationName ?? user.name ?? 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.organizationName ?? user.name}
                  </span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50"
                    onMouseLeave={() => setDropOpen(false)}>
                    {isOrg && (
                      <>
                        <Link to="/dashboard" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <LayoutDashboard size={15} className="text-slate-400" /> Dashboard
                        </Link>
                        <Link to="/dashboard/post" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <PlusCircle size={15} className="text-slate-400" /> Post Internship
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                      </>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 animate-fade-in">
          <MobileLink to="/internships"   onClick={() => setMobileOpen(false)}>Browse Jobs</MobileLink>
          {isOrg && (
            <>
              <MobileLink to="/dashboard"       onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
              <MobileLink to="/dashboard/post"  onClick={() => setMobileOpen(false)}>Post Internship</MobileLink>
            </>
          )}
          {!user ? (
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login"    className="btn-secondary w-full justify-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn-primary  w-full justify-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </div>
          ) : (
            <button onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-2">
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  )
}

const MobileLink = ({ to, children, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className={({ isActive }) =>
      `block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
        isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50'
      }`}
  >
    {children}
  </NavLink>
)
