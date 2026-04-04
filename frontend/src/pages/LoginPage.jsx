import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail } from '../utils/formValidation.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const em = validateEmail(email);
    if (em) {
      setFieldErr(em);
      return;
    }
    setFieldErr('');
    if (!password) {
      setFieldErr('Password is required');
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.user?.role === 'organizer') navigate('/organizer/profile');
      else navigate('/skill-development');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p className="auth-sub">Login to Skill Development</p>
        </div>
        <form className="form" onSubmit={submit}>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {(fieldErr || error) && (
            <div className="alert">{fieldErr || error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          New here? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
