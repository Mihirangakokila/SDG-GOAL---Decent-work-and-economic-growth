import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import { Loader2, Briefcase, BookmarkX, ArrowRight } from 'lucide-react'
import { formatDate, skillColor, statusBadge } from '../utils/helpers'
import { MapPin, Clock, GraduationCap, Eye, CalendarDays } from 'lucide-react'

const STORAGE_KEY = 'savedInternships'
const getSaved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

export default function SavedInternshipsPage() {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const ids = getSaved()
    if (!ids.length) {
      setLoading(false)
      return
    }
    Promise.all(ids.map(id => internshipsAPI.getById(id).catch(() => null)))
      .then(results => {
        setInternships(
          results
            .filter(Boolean)
            .map(r => r.data)
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = (id) => {
    const updated = getSaved().filter(s => s !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setInternships(prev => prev.filter(i => i._id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-1">Saved Internships</h1>
        <p className="text-slate-500 text-sm">
          {internships.length === 0
            ? 'No saved internships yet'
            : `${internships.length} saved listing${internships.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {internships.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Briefcase size={28} className="text-slate-400" />
          </div>
          <div>
            <p className="font-display font-semibold text-navy-900 text-lg">Nothing saved yet</p>
            <p className="text-slate-500 text-sm mt-1 max-w-xs">
              Browse internships and click the Save button to keep track of roles you like.
            </p>
          </div>
          <Link to="/internships" className="btn-primary mt-2">
            Browse Internships
          </Link>
        </div>
      ) : (
        /* ── Cards grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {internships.map((internship, i) => (
            <SavedCard
              key={internship._id}
              internship={internship}
              onRemove={handleRemove}
              delay={i * 0.04}
              onApply={() => navigate(`/internships/${internship._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SavedCard — matches InternshipCard visual style
   but adds unsave + Apply Now CTA at the bottom
───────────────────────────────────────────── */
function SavedCard({ internship, onRemove, delay, onApply }) {
  const {
    _id, tittle, description, location, duration,
    status, requiredSkills = [], requiredEducation,
    viewCount, createdAt, organizationId,
  } = internship

  const orgName =
    organizationId?.organizationName ??
    organizationId?.name ??
    'Organization'

  return (
    <div
      className="card p-5 flex flex-col gap-4 animate-fade-up hover:-translate-y-0.5 transition-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* ── Top row: org avatar + title + status + unsave ── */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand/20 to-navy-100 flex items-center justify-center border border-slate-100 flex-shrink-0">
          <span className="text-sm font-bold text-brand font-display">
            {orgName[0].toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={statusBadge(status)}>{status}</span>
          </div>
          <Link
            to={`/internships/${_id}`}
            className="font-display font-semibold text-navy-900 hover:text-brand transition-colors leading-tight line-clamp-2"
          >
            {tittle}
          </Link>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{orgName}</p>
        </div>

        {/* Unsave button */}
        <button
          onClick={() => onRemove(_id)}
          title="Remove from saved"
          className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <BookmarkX size={16} />
        </button>
      </div>

      {/* ── Description snippet ── */}
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
          {description}
        </p>
      )}

      {/* ── Meta chips ── */}
      <div className="flex flex-wrap gap-2">
        {location && <MiniChip icon={<MapPin size={11} />} label={location} />}
        {duration && <MiniChip icon={<Clock size={11} />} label={duration} />}
        {requiredEducation && <MiniChip icon={<GraduationCap size={11} />} label={requiredEducation} />}
        <MiniChip icon={<CalendarDays size={11} />} label={formatDate(createdAt)} />
        <MiniChip icon={<Eye size={11} />} label={`${viewCount ?? 0} views`} />
      </div>

      {/* ── Skills ── */}
      {requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {requiredSkills.slice(0, 4).map((skill, i) => (
            <span
              key={skill}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${skillColor(i)}`}
            >
              {skill}
            </span>
          ))}
          {requiredSkills.length > 4 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
              +{requiredSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 pt-1 mt-auto">
        <Link
          to={`/internships/${_id}`}
          className="btn-secondary flex-1 justify-center text-sm gap-1.5"
        >
          View Details
        </Link>

        {status === 'Active' ? (
          <button
            onClick={onApply}
            className="btn-primary flex-1 justify-center text-sm gap-1.5"
          >
            Apply Now <ArrowRight size={13} />
          </button>
        ) : (
          <div className="flex-1 text-center py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
            Closed
          </div>
        )}
      </div>
    </div>
  )
}

const MiniChip = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 border border-slate-100">
    <span className="text-slate-400">{icon}</span>
    {label}
  </span>
)
