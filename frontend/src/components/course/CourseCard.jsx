import React from 'react';
import { ExternalLink } from 'lucide-react';

const CourseCard = ({ course, showApply, onApply, appliedIds }) => {
  const id = course._id;
  const applied = appliedIds?.has(String(id));
  const isPhysical = course.type === 'Physical';

  return (
    <article className="card p-6 flex flex-col gap-4 h-full animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <span
          className={
            isPhysical
              ? 'badge-blue'
              : 'badge-green'
          }
        >
          {course.type || 'Course'}
        </span>
        {course.organizerId?.name && (
          <span className="text-xs text-slate-500 text-right line-clamp-2 max-w-[55%]">
            By {course.organizerId.name}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-display font-semibold text-navy-900 text-lg leading-tight line-clamp-2">
          {course.title}
        </h3>
        {isPhysical && (
          <p className="text-sm text-slate-500 mt-1.5">
            <span className="font-medium text-slate-600">Location:</span>{' '}
            {course.location || '—'}
          </p>
        )}
      </div>

      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
        {course.description || 'No description.'}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-4 mt-auto border-t border-slate-50">
        <a
          className="btn-secondary text-xs sm:text-sm"
          href={course.link}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} className="shrink-0" />
          View course
        </a>
        {showApply && (
          <button
            type="button"
            className={`text-xs sm:text-sm ${applied ? 'btn-secondary opacity-70 cursor-not-allowed' : 'btn-primary'}`}
            disabled={applied}
            onClick={() => onApply?.(id)}
          >
            {applied ? 'Applied' : 'Apply'}
          </button>
        )}
      </div>
    </article>
  );
};

export default CourseCard;
