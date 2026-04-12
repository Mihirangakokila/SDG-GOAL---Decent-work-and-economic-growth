import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { applyToCourseApi, myApplicationsApi } from '../api/applicationsApi.js';
import { getCoursesApi } from '../api/coursesApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import CourseCard from '../components/course/CourseCard.jsx';

const SkillDevelopmentPage = () => {
  const { isAuthenticated, role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await getCoursesApi();
      setCourses(data);
    } catch (e) {
      const d = e.response?.data;
      const errMsg = typeof d === 'string' ? d : d?.message;
      setError(
        errMsg ||
          (e.code === 'ERR_NETWORK'
            ? 'Cannot reach the API. Is the backend running on the same port as VITE_BACKEND_ORIGIN?'
            : '') ||
          'Could not load courses'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!isAuthenticated || role !== 'youth') return;
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
    <div className="overflow-x-hidden min-h-screen bg-slate-50">
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-brand/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-700/35 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-medium text-slate-300 mb-6">
              <GraduationCap size={16} className="text-cyan-300" />
              Skill Development
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mb-5">
              Courses that move you{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                from learning to doing
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8">
              Browse courses added by organizers. Log in as a youth account to apply. Organizations can
              publish and manage courses from their profile. Not sure where to start?{' '}
              <Link to="/advisor" className="text-cyan-300 hover:text-white underline underline-offset-2 font-medium">
                Ask the course advisor
              </Link>
              .
            </p>
            {!isAuthenticated && (
              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white border border-white/25 bg-white/10 hover:bg-white/15 active:scale-95 transition-all duration-150"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {msg && (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {msg}
          </div>
        )}
        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title">All courses</h2>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Sparkles size={14} className="text-brand shrink-0" />
              Curated opportunities from partner organizers
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-brand" aria-hidden />
            <p className="text-sm">Loading courses…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <CourseCard
                  key={c._id}
                  course={c}
                  showApply={isAuthenticated && role === 'youth'}
                  onApply={handleApply}
                  appliedIds={appliedIds}
                />
              ))}
            </div>
            {courses.length === 0 && !error && (
              <p className="text-center text-slate-500 py-16 text-sm">
                No courses yet. Organizers can add some from their profile.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SkillDevelopmentPage;
