import React from 'react';

const CourseCard = ({ course, showApply, onApply, appliedIds }) => {
  const id = course._id;
  const applied = appliedIds?.has(String(id));

  return (
    <article className="sd-card">
      <div className="sd-card-top">
        <span className={`sd-tag sd-tag--${course.type === 'Physical' ? 'phys' : 'on'}`}>
          {course.type}
        </span>
        {course.organizerId?.name && (
          <span className="sd-organizer">By {course.organizerId.name}</span>
        )}
      </div>
      <h3 className="sd-title">{course.title}</h3>
      {course.type === 'Physical' && (
        <p className="sd-meta">
          <strong>Location:</strong> {course.location || '—'}
        </p>
      )}
      <p className="sd-desc">{course.description || 'No description.'}</p>
      <div className="sd-actions">
        <a className="btn-link" href={course.link} target="_blank" rel="noreferrer">
          View course
        </a>
        {showApply && (
          <button
            type="button"
            className="btn-apply"
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
