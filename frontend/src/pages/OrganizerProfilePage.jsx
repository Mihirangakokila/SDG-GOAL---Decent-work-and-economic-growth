import React, { useEffect, useState } from 'react';
import {
  createCourseApi,
  deleteCourseApi,
  getMyCoursesApi,
  updateCourseApi,
} from '../api/coursesApi.js';
import CourseCard from '../components/CourseCard.jsx';

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

  const load = async () => {
    setError('');
    try {
      const { data } = await getMyCoursesApi();
      setCourses(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load your courses');
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
    <section className="org-page">
      <div className="sd-hero sd-hero--compact">
        <div className="sd-hero-inner">
          <p className="sd-kicker">Organizer profile</p>
          <h1>
            Your <span className="sd-gradient">courses</span>
          </h1>
          <p className="sd-lead">Create, update, or delete the courses you publish.</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="org-layout">
        <div className="org-form-card">
          <h2>{editingId ? 'Edit course' : 'Add a course'}</h2>
          <form className="form" onSubmit={submit}>
            <div>
              <label className="label">Course name</label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="e.g. Python course"
                required
              />
            </div>
            <div>
              <label className="label">Online or Physical</label>
              <select name="type" value={form.type} onChange={onChange} required>
                <option value="Online">Online</option>
                <option value="Physical">Physical</option>
              </select>
            </div>
            {form.type === 'Physical' && (
              <div>
                <label className="label">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  placeholder="Venue / city"
                  required
                />
              </div>
            )}
            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={4}
                placeholder="Certificate, what learners achieve, outcomes…"
              />
            </div>
            <div>
              <label className="label">Course link</label>
              <input
                name="link"
                type="url"
                value={form.link}
                onChange={onChange}
                placeholder="https://www.udemy.com/…"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update course' : 'Submit course'}
              </button>
              {editingId && (
                <button type="button" className="btn-ghost" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div>
          <h2 className="sd-section-title">Your published courses</h2>
          <div className="sd-grid">
            {courses.map((c) => (
              <div key={c._id} className="org-card-wrap">
                <CourseCard course={{ ...c, organizerId: null }} />
                <div className="org-card-actions">
                  <button type="button" className="btn-ghost" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger" onClick={() => remove(c._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {courses.length === 0 && <p className="muted">You have not added any courses yet.</p>}
        </div>
      </div>
    </section>
  );
};

export default OrganizerProfilePage;
