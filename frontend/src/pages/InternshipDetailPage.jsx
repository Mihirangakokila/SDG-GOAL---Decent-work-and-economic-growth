import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import {
  MapPin, Clock, Eye, Briefcase, GraduationCap,
  ArrowLeft, CalendarDays, Share2, BookmarkPlus, Loader2
} from 'lucide-react'
import { formatDate, skillColor, statusBadge } from '../utils/helpers'

export default function InternshipDetailPage() {
  const { id } = useParams()
  const [internship, setInternship] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        await internshipsAPI.incrementView(id)
        const res = await internshipsAPI.getById(id)
        setInternship(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )

  if (!internship) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="font-display font-semibold text-navy-900 text-xl">Internship not found</p>
      <Link to="/internships" className="btn-primary">Browse other listings</Link>
    </div>
  )

  const {
    tittle, description, location, duration, status,
    requiredSkills = [], requiredEducation, viewCount,
    createdAt, organizationId
  } = internship

  const orgName = organizationId?.organizationName ?? organizationId?.name ?? 'Organization'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <Link to="/internships" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand mb-8 transition-colors">
        <ArrowLeft size={15} /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header card */}
          <div className="card p-7 animate-fade-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-navy-100 flex items-center justify-center border border-slate-100 flex-shrink-0">
                <span className="text-xl font-bold text-brand font-display">
                  {orgName[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={statusBadge(status)}>{status}</span>
                </div>
                <h1 className="font-display font-bold text-2xl text-navy-900 leading-tight">{tittle}</h1>
                <p className="text-slate-500 mt-1">{orgName}</p>
              </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-3">
              {location && (
                <Chip icon={<MapPin size={13} />} label={location} />
              )}
              {duration && (
                <Chip icon={<Clock size={13} />} label={duration} />
              )}
              {requiredEducation && (
                <Chip icon={<GraduationCap size={13} />} label={requiredEducation} />
              )}
              <Chip icon={<CalendarDays size={13} />} label={`Posted ${formatDate(createdAt)}`} />
              <Chip icon={<Eye size={13} />} label={`${viewCount ?? 0} views`} />
            </div>
          </div>

          {/* Description */}
          <div className="card p-7 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="font-display font-bold text-navy-900 text-lg mb-4">About this Internship</h2>
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {/* Skills */}
          {requiredSkills.length > 0 && (
            <div className="card p-7 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display font-bold text-navy-900 text-lg mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, i) => (
                  <span key={skill}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${skillColor(i)}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Apply CTA */}
          <div className="card p-6 animate-fade-up sticky top-24">
            <h3 className="font-display font-semibold text-navy-900 mb-1">Interested in this role?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Apply before this listing closes. Reach out to the organization directly.
            </p>
            {status === 'Active' ? (
              <button className="btn-primary w-full justify-center text-base py-3">
                Apply Now
              </button>
            ) : (
              <div className="w-full py-3 text-center rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
                Applications Closed
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button className="btn-secondary flex-1 justify-center text-sm gap-1.5">
                <BookmarkPlus size={14} /> Save
              </button>
              <button className="btn-secondary flex-1 justify-center text-sm gap-1.5">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-6 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display font-semibold text-navy-900">Quick Info</h3>
            {[
              { label: 'Duration',   value: duration          },
              { label: 'Location',   value: location          },
              { label: 'Education',  value: requiredEducation },
              { label: 'Status',     value: status            },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                <span className="text-sm text-slate-700 text-right font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Browse more */}
          <Link to="/internships" className="card p-5 flex items-center gap-3 group hover:-translate-y-0.5 transition-transform animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Briefcase size={16} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-navy-900 text-sm">Browse more internships</p>
              <p className="text-xs text-slate-400 mt-0.5">Find your perfect match</p>
            </div>
            <ArrowLeft size={15} className="text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

const Chip = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-sm text-slate-600 border border-slate-100">
    <span className="text-slate-400">{icon}</span>
    {label}
  </span>
)
