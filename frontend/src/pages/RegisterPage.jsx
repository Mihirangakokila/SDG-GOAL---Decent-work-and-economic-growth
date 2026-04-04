import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerOrganizerApi, registerUserApi } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/formValidation.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('user');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [orgForm, setOrgForm] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateUser = () => {
    const e = {};
    const n = validateName(userForm.username, 'Username');
    if (n) e.username = n;
    const em = validateEmail(userForm.email);
    if (em) e.email = em;
    const p = validatePassword(userForm.password);
    if (p) e.password = p;
    const c = validateConfirm(userForm.password, userForm.confirmPassword);
    if (c) e.confirmPassword = c;
    return e;
  };

  const validateOrg = () => {
    const e = {};
    const n = validateName(orgForm.businessName, 'Business name');
    if (n) e.businessName = n;
    const em = validateEmail(orgForm.email);
    if (em) e.email = em;
    const p = validatePassword(orgForm.password);
    if (p) e.password = p;
    const c = validateConfirm(orgForm.password, orgForm.confirmPassword);
    if (c) e.confirmPassword = c;
    return e;
  };

  const submitUser = async (ev) => {
    ev.preventDefault();
    const e = validateUser();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await registerUserApi({
        username: userForm.username.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        confirmPassword: userForm.confirmPassword,
      });
      await login({ email: userForm.email.trim(), password: userForm.password });
      navigate('/skill-development');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const submitOrg = async (ev) => {
    ev.preventDefault();
    const e = validateOrg();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await registerOrganizerApi({
        businessName: orgForm.businessName.trim(),
        email: orgForm.email.trim(),
        password: orgForm.password,
        confirmPassword: orgForm.confirmPassword,
      });
      await login({ email: orgForm.email.trim(), password: orgForm.password });
      navigate('/organizer/profile');
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Skill Development</h1>
          <p className="auth-sub">Create your account</p>
        </div>

        <div className="segment">
          <button
            type="button"
            className={mode === 'user' ? 'segment-btn active' : 'segment-btn'}
            onClick={() => {
              setMode('user');
              setErrors({});
            }}
          >
            User register
          </button>
          <button
            type="button"
            className={mode === 'organizer' ? 'segment-btn active' : 'segment-btn'}
            onClick={() => {
              setMode('organizer');
              setErrors({});
            }}
          >
            Organizer register
          </button>
        </div>

        {errors.form && <div className="alert">{errors.form}</div>}

        {mode === 'user' ? (
          <form className="form" onSubmit={submitUser}>
            <div>
              <label className="label">Username</label>
              <input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                autoComplete="username"
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                value={userForm.confirmPassword}
                onChange={(e) =>
                  setUserForm({ ...userForm, confirmPassword: e.target.value })
                }
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating…' : 'Register as user'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={submitOrg}>
            <div>
              <label className="label">Organizer / business name</label>
              <input
                value={orgForm.businessName}
                onChange={(e) => setOrgForm({ ...orgForm, businessName: e.target.value })}
              />
              {errors.businessName && (
                <span className="field-error">{errors.businessName}</span>
              )}
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={orgForm.email}
                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={orgForm.password}
                onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                value={orgForm.confirmPassword}
                onChange={(e) =>
                  setOrgForm({ ...orgForm, confirmPassword: e.target.value })
                }
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating…' : 'Register as organizer'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
