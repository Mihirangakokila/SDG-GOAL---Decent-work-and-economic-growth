import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <section className="auth-layout">
    <div className="auth-card" style={{ textAlign: 'center' }}>
      <h1 style={{ margin: '0 0 0.5rem' }}>404</h1>
      <p className="auth-sub">Page not found</p>
      <Link to="/skill-development" className="btn-primary" style={{ display: 'inline-block' }}>
        Back to courses
      </Link>
    </div>
  </section>
);

export default NotFoundPage;
