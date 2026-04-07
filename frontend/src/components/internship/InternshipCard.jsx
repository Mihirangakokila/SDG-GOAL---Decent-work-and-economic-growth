import { Link } from 'react-router-dom'
import { MapPin, Clock, Eye, Bookmark, ArrowUpRight } from 'lucide-react'
import { timeAgo, truncate, skillColor, statusBadge } from '../../utils/helpers'

export default function InternshipCard({ internship, showStatus = false }) {
  const {
    _id, tittle, description, location, duration,
    requiredSkills = [], status, viewCount, createdAt,
    organizationId
  } = internship

  const orgName = organizationId?.organizationName ?? organizationId?.name ?? 'Organization'
  const orgInitial = orgName[0].toUpperCase()

  return (
    <Link to={`/internships/${_id}`}
      className="card p-5 flex flex-col gap-4 group cursor-pointer animate-fade-up"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand/20 to-navy-100 flex items-center justify-center flex-shrink-0 border border-slate-100">
            <span className="text-base font-bold text-brand font-display">{orgInitial}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-navy-900 text-base leading-tight
                           group-hover:text-brand transition-colors line-clamp-1">
              {tittle}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{orgName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showStatus && (
            <span className={statusBadge(status)}>{status}</span>
          )}
          <ArrowUpRight size={16}
            className="text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                       transition-all duration-200" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
        {truncate(description, 140)}
      </p>

      {/* Skills */}
      {requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {requiredSkills.slice(0, 4).map((skill, i) => (
            <span key={skill}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${skillColor(i)}`}>
              {skill}
            </span>
          ))}
          {requiredSkills.length > 4 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
              +{requiredSkills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-50">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {location}
          </span>
        )}
        {duration && (
          <span className="flex items-center gap-1">
            <Clock size={12} /> {duration}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Eye size={12} /> {viewCount ?? 0}
        </span>
        <span>{timeAgo(createdAt)}</span>
      </div>
    </Link>
  )
}
