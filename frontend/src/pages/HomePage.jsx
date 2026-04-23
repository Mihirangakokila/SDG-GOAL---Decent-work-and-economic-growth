import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, ArrowRight, Briefcase, Users, TrendingUp,
  Star, ChevronRight, Zap, Shield, Globe, Navigation
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { internshipsAPI } from '../services/api'

const POPULAR_SKILLS = ['React', 'Python', 'Data Analysis', 'UI/UX Design', 'Machine Learning', 'Node.js', 'Java', 'Marketing']

const STATS = [
  { label: 'Active Internships', value: '2,400+' },
  { label: 'Partner Organizations', value: '580+'  },
  { label: 'Students Placed',     value: '12,000+' },
]

const FEATURES = [
  {
    icon: Zap,
    color: 'amber',
    title: 'Instant Match',
    desc: 'Smart skill-based matching connects you with the right opportunities in seconds.',
  },
  {
    icon: Shield,
    color: 'blue',
    title: 'Verified Listings',
    desc: 'Every internship is posted by verified organizations — no spam, no scams.',
  },
  {
    icon: Globe,
    color: 'emerald',
    title: 'Local & Remote',
    desc: 'Browse opportunities near you or work from anywhere in the world.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your profile', desc: 'Tell us about your skills, education, and career goals.' },
  { step: '02', title: 'Browse & search',     desc: 'Filter thousands of internships by skill, location, and more.' },
  { step: '03', title: 'Apply & get hired',   desc: 'Apply in one click and track your applications in real time.' },
]

export default function HomePage() {
  const [keyword,  setKeyword]  = useState('')
  const [location, setLocation] = useState('')
  const [nearbyInternships, setNearbyInternships] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [locationAvailable, setLocationAvailable] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Fetch nearby internships for youth users ──────────────────────────────
  useEffect(() => {
    if (user?.role !== 'youth') return

    setNearbyLoading(true)
    internshipsAPI.getNearby({ radius: 50, limit: 6 })
      .then(res => {
        setNearbyInternships(res.data.internships || [])
        setLocationAvailable(res.data.locationAvailable)
      })
      .catch(() => {
        // Silently fail — section simply won't show
      })
      .finally(() => setNearbyLoading(false))
  }, [user])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword)  params.set('keyword',  keyword)
    if (location) params.set('location', location)
    navigate(`/internships?${params.toString()}`)
  }

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-700/40 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-slate-300 mb-8 animate-fade-in">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              Trusted by 580+ companies worldwide
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 animate-fade-up">
              Launch Your Career
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                With the Right Internship
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Discover thousands of internships across every industry.
              Connect with forward-thinking companies looking for talent like you.
            </p>

            {/* Search box */}
            <form onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto animate-fade-up"
              style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Job title, skill, keyword..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>
              <div className="relative flex-1 hidden sm:block">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="City or remote..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-l border-slate-100 focus:outline-none"
                />
              </div>
              <button type="submit"
                className="btn-primary px-6 py-3 rounded-xl text-sm flex-shrink-0">
                Search Jobs
              </button>
            </form>

            {/* Popular skills */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <span className="text-xs text-slate-500">Popular:</span>
              {POPULAR_SKILLS.map(s => (
                <Link key={s}
                  to={`/internships?skills=${s}`}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10 transition-all">
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mt-16 pt-10 border-t border-white/10 animate-fade-up"
            style={{ animationDelay: '0.35s' }}>
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-display font-bold text-2xl text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearby Internships (youth only) ──────────────────────────────────── */}
      {user?.role === 'youth' && (
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation size={16} className="text-brand" />
                  <p className="text-brand text-sm font-semibold uppercase tracking-widest">Near You</p>
                </div>
                <h2 className="section-title">Internships in Your Area</h2>
                {locationAvailable && (
                  <p className="text-slate-500 text-sm mt-1">Active opportunities within 50 km of your profile location</p>
                )}
              </div>
              <Link to="/internships" className="btn-secondary text-sm hidden sm:inline-flex">
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {nearbyLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : !locationAvailable ? (
              <div className="card p-8 text-center">
                <MapPin size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">Location not set</p>
                <p className="text-slate-500 text-sm mb-4">
                  Add your district and province to your profile to see nearby internships highlighted here.
                </p>
                <Link to="/profile" className="btn-primary text-sm">
                  Update Profile
                </Link>
              </div>
            ) : nearbyInternships.length === 0 ? (
              <div className="card p-8 text-center">
                <Briefcase size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">No nearby internships right now</p>
                <p className="text-slate-500 text-sm">Check back soon, or browse all available listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {nearbyInternships.map(internship => (
                  <NearbyCard key={internship._id} internship={internship} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">Why InternHub</p>
            <h2 className="section-title">Everything you need to land your internship</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => {
              const colors = {
                amber:   'bg-amber-50 text-amber-600',
                blue:    'bg-blue-50 text-blue-600',
                emerald: 'bg-emerald-50 text-emerald-600',
              }
              return (
                <div key={title} className="card p-7 hover:-translate-y-1 transition-transform">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${colors[color]}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-navy-900 text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="section-title">Get started in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="text-center px-4" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 rounded-2xl bg-navy-950 text-white flex items-center justify-center mx-auto mb-5
                                font-display font-bold text-xl shadow-lg">
                  {step}
                </div>
                <h3 className="font-display font-bold text-navy-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA for Organizations ─────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-brand to-navy-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white">
              <h2 className="font-display font-bold text-3xl mb-3">Are you an organization?</h2>
              <p className="text-blue-200 text-lg">Post internship listings and find your next great hire.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link to="/register" className="btn-secondary text-sm">
                Create Account
              </Link>
              <Link to="/dashboard/post" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/20 text-white
                font-semibold text-sm rounded-lg border border-white/30 hover:bg-white/30 transition-colors">
                Post Now <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

// ── Nearby internship card ────────────────────────────────────────────────────
function NearbyCard({ internship }) {
  return (
    <Link
      to={`/internships/${internship._id}`}
      className="card p-6 hover:-translate-y-1 transition-transform border-2 border-blue-100 hover:border-brand/40 group relative overflow-hidden"
    >
      {/* "Nearby" badge */}
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
        <Navigation size={10} /> Nearby
      </span>

      <div className="flex items-start gap-3 mb-3 pr-16">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
          <Briefcase size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-navy-900 text-sm leading-snug group-hover:text-brand transition-colors truncate">
            {internship.tittle}
          </h3>
          {internship.location && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin size={11} /> {internship.location}
            </p>
          )}
        </div>
      </div>

      {internship.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {internship.requiredSkills.slice(0, 3).map(skill => (
            <span key={skill}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
              {skill}
            </span>
          ))}
          {internship.requiredSkills.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-xs">
              +{internship.requiredSkills.length - 3}
            </span>
          )}
        </div>
      )}

      {internship.duration && (
        <p className="text-xs text-slate-400 mt-3">{internship.duration}</p>
      )}
    </Link>
  )
}
