import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Briefcase, Menu, X, ChevronDown,
  LayoutDashboard, LogOut, User, PlusCircle, Building2, GraduationCap, BookmarkCheck,
  MessageSquare
} from 'lucide-react'
import UnreadBadge from '../messaging/UnreadBadge'

export default function Navbar() {
  const { user, logout, isOrg, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

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
              <Briefcase className="w-4 h-4 text-white" size={18} />
            </div>
            <span className="font-display font-bold text-xl text-navy-900">
              Intern<span className="text-brand">Hub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {!isAdmin && (
              <>
                <NavLink
                  to="/internships"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  Browse Jobs
                </NavLink>
                <NavLink
                  to="/skill-development"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  Browse Courses
                </NavLink>
                {user && !isOrg && (
                  <>
                    <NavLink
                      to="/applications"
                      className={({ isActive }) =>
                        `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                        }`
                      }
                    >
                      My Applications
                    </NavLink>
                    <NavLink
                      to="/saved"
                      className={({ isActive }) =>
                        `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                        }`
                      }
                    >
                      Saved
                    </NavLink>
                    <NavLink
                      to="/messages"
                      className={({ isActive }) =>
                        `relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                        }`
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                      Messages
                      <UnreadBadge />
                    </NavLink>
                  </>
                )}
              </>
            )}

            {isAdmin && (
              <NavLink
                to="/admin/organizations"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                  }`
                }
              >
                Admin Dashboard
              </NavLink>
            )}

            {!user && (
              <NavLink
                to="/for-organizations"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                  }`
                }
              >
                For Organizations
              </NavLink>
            )}

            {isOrg && (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/dashboard/post"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  Post Internship
                </NavLink>
                <NavLink
                  to="/organization/courses"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  My Courses
                </NavLink>
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? 'text-brand' : 'text-slate-600 hover:text-navy-900'
                    }`
                  }
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                  <UnreadBadge />
                </NavLink>
              </>
            )}
            
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50"
                >
                  <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-brand">
                      {(user.organizationName ?? user.name ?? 'U')[0].toUpperCase()}
                    </span>
                  </div>

                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.organizationName ?? user.name}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${
                      dropOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-100 shadow-lg py-1 z-50"
                    onMouseLeave={() => setDropOpen(false)}
                  >
                    {isAdmin && (
                      <Link
                        to="/admin/organizations"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                      >
                        <Building2 size={15} /> Admin Dashboard
                      </Link>
                    )}

                    {isOrg && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>

                        <Link
                          to="/dashboard/post"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <PlusCircle size={15} /> Post Internship
                        </Link>

                        <Link
                          to="/organization"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <Building2 size={15} /> Organization Profile
                        </Link>

                        <Link
                          to="/organization/courses"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <GraduationCap size={15} /> My Courses
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setDropOpen(false)}
                          className="relative flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <MessageSquare size={15} /> Messages
                          <UnreadBadge />
                        </Link>

                        <div className="border-t my-1" />
                      </>
                    )}

                    {!isOrg && !isAdmin && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Courses
                        </p>
                        <Link
                          to="/skill-development"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <GraduationCap size={15} /> Browse Courses
                        </Link>

                        <div className="border-t my-1" />

                        <Link
                          to="/applications"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <Briefcase size={15} /> My Applications
                        </Link>

                        <Link
                          to="/saved"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <BookmarkCheck size={15} /> Saved Internships
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setDropOpen(false)}
                          className="relative flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <MessageSquare size={15} /> Messages
                          <UnreadBadge />
                        </Link>

                        <Link
                          to="/profile"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                        >
                          <User size={15} /> Profile
                        </Link>

                        <div className="border-t my-1" />
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
          <MobileLink to="/internships" onClick={() => setMobileOpen(false)}>
            Browse Jobs
          </MobileLink>

          {!isAdmin && (
            <MobileLink to="/skill-development" onClick={() => setMobileOpen(false)}>
              Browse Courses
            </MobileLink>
          )}

          {isAdmin && (
            <MobileLink to="/admin/organizations" onClick={() => setMobileOpen(false)}>
              Admin Dashboard
            </MobileLink>
          )}

          {isOrg && (
            <>
              <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>
                Dashboard
              </MobileLink>
              <MobileLink to="/dashboard/post" onClick={() => setMobileOpen(false)}>
                Post Internship
              </MobileLink>
              <MobileLink to="/organization" onClick={() => setMobileOpen(false)}>
                Organization Profile
              </MobileLink>
              <MobileLink to="/organization/courses" onClick={() => setMobileOpen(false)}>
                My Courses
              </MobileLink>
              <NavLink
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${
                    isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                <UnreadBadge />
              </NavLink>
            </>
          )}

          {user && !isOrg && !isAdmin && (
            <>
              <MobileLink to="/applications" onClick={() => setMobileOpen(false)}>
                My Applications
              </MobileLink>
              <MobileLink to="/saved" onClick={() => setMobileOpen(false)}>
                Saved Internships
              </MobileLink>
              <NavLink
                to="/messages"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${
                    isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <MessageSquare className="w-4 h-4" />
                Messages
                <UnreadBadge />
              </NavLink>
              <MobileLink to="/profile" onClick={() => setMobileOpen(false)}>
                Profile
              </MobileLink>
            </>
          )}

          {!user ? (
            <div className="pt-3 flex flex-col gap-2">
              <Link to="/login" className="btn-secondary w-full text-center">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary w-full text-center">
                Get Started
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-2"
            >
              <LogOut size={15} className="inline mr-2" />
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  )
}

const MobileLink = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-4 py-2.5 text-sm font-medium rounded-xl ${
        isActive ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-50'
      }`
    }
  >
    {children}
  </NavLink>
)
