import React, { useEffect, useState } from 'react';
import { GraduationCap, Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  createCourseApi,
  deleteCourseApi,
  getMyCoursesApi,
  updateCourseApi,
} from '../api/coursesApi.js';
import CourseCard from '../components/course/CourseCard.jsx';

const emptyForm = {
  title: '',
  type: 'Online',
  location: '',
  description: '',
  link: '',
};

const OrganizerProfilePage = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await getMyCoursesApi();
      setCourses(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      title: c.title,
      type: c.type,
      location: c.location || '',
      description: c.description || '',
      link: c.link,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        location: form.type === 'Physical' ? form.location : '',
      };
      if (editingId) {
        await updateCourseApi(editingId, payload);
      } else {
        await createCourseApi(payload);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourseApi(id);
      if (editingId === id) cancelEdit();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-brand/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-700/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-medium text-slate-300 mb-4">
              <GraduationCap size={16} className="text-cyan-300" />
              Organizer profile
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
              Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                courses
              </span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              Create, update, or delete the courses you publish.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div
            className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="card p-6 sm:p-8 lg:sticky lg:top-24">
              <h2 className="font-display font-bold text-xl text-navy-900 mb-6">
                {editingId ? 'Edit course' : 'Add a course'}
              </h2>
              <form className="space-y-5" onSubmit={submit}>
                <div>
                  <label className="label" htmlFor="org-course-title">
                    Course name
                  </label>
                  <input
                    id="org-course-title"
                    className="input"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="e.g. Python course"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="org-course-type">
                    Online or Physical
                  </label>
                  <select
                    id="org-course-type"
                    className="input"
                    name="type"
                    value={form.type}
                    onChange={onChange}
                    required
                  >
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                  </select>
                </div>
                {form.type === 'Physical' && (
                  <div>
                    <label className="label" htmlFor="org-course-location">
                      Location
                    </label>
                    <input
                      id="org-course-location"
                      className="input"
                      name="location"
                      value={form.location}
                      onChange={onChange}
                      placeholder="Venue / city"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="org-course-desc">
                    Description
                  </label>
                  <textarea
                    id="org-course-desc"
                    className="input min-h-[120px] resize-y"
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    placeholder="Certificate, what learners achieve, outcomes…"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="org-course-link">
                    Course link
                  </label>
                  <input
                    id="org-course-link"
                    className="input"
                    name="link"
                    type="url"
                    value={form.link}
                    onChange={onChange}
                    placeholder="https://www.udemy.com/…"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Update course' : 'Submit course'}
                  </button>
                  {editingId && (
                    <button type="button" className="btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <h2 className="section-title mb-2">Your published courses</h2>
            <p className="text-sm text-slate-500 mb-8">
              These appear on Skill Development for youth to browse and apply.
            </p>

            {loading ? (
              <div className="card p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="w-9 h-9 animate-spin text-brand" aria-hidden />
                <p className="text-sm">Loading your courses…</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((c) => (
                    <div key={c._id} className="flex flex-col gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs sm:text-sm text-slate-600">
                        <span className="font-semibold text-navy-800 tabular-nums">
                          {c.applicationCount ?? 0}
                        </span>{' '}
                        {c.applicationCount === 1 ? 'learner has' : 'learners have'} applied
                      </div>
                      <CourseCard course={{ ...c, organizerId: null }} showApply={false} />
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          className="btn-ghost text-sm"
                          onClick={() => startEdit(c)}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                            bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
                          onClick={() => remove(c._id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {courses.length === 0 && (
                  <div className="card p-10 text-center">
                    <p className="text-slate-500 text-sm">
                      You have not added any courses yet. Use the form to publish your first course.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfilePage;
