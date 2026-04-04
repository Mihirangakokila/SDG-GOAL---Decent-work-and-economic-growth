import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applyToCourseApi, myApplicationsApi } from '../api/applicationsApi.js';
import { getCoursesApi } from '../api/coursesApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import CourseCard from '../components/CourseCard.jsx';

const SkillDevelopmentPage = () => {
  const { isAuthenticated, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setError('');
    try {
      const { data } = await getCoursesApi();
      setCourses(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load courses');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated || role !== 'user') return;
      try {
        const { data } = await myApplicationsApi();
        const ids = new Set(data.map((a) => String(a.courseId?._id || a.courseId)));
        setAppliedIds(ids);
      } catch {
        /* ignore */
      }
    };
    run();
  }, [isAuthenticated, role]);

  const handleApply = async (courseId) => {
    setMsg('');
    try {
      await applyToCourseApi(courseId);
      setAppliedIds((prev) => new Set([...prev, String(courseId)]));
      setMsg('Application submitted.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Could not apply');
    }
  };

  return (
    <section className="sd-page">
      <div className="sd-hero">
        <div className="sd-hero-inner">
          <p className="sd-kicker">Skill Development</p>
          <h1>
            Courses that move you{' '}
            <span className="sd-gradient">from learning to doing</span>
          </h1>
          <p className="sd-lead">
            Browse courses added by organizers. Log in as a user to apply. Organizers can
            publish and manage courses from their profile.
          </p>
          {!isAuthenticated && (
            <div className="sd-hero-cta">
              <Link to="/login" className="btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn-ghost">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {msg && <div className="banner banner--ok">{msg}</div>}
      {error && <div className="alert">{error}</div>}

      <h2 className="sd-section-title">All courses</h2>
      <div className="sd-grid">
        {courses.map((c) => (
          <CourseCard
            key={c._id}
            course={c}
            showApply={isAuthenticated && role === 'user'}
            onApply={handleApply}
            appliedIds={appliedIds}
          />
        ))}
      </div>
      {courses.length === 0 && !error && (
        <p className="muted centered">No courses yet. Organizers can add some.</p>
      )}
    </section>
  );
};

export default SkillDevelopmentPage;
