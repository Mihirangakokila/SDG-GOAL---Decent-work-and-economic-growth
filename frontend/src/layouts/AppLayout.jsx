import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const AppLayout = ({ children }) => {
  const { isAuthenticated, role, logout } = useAuth();

  return (
    <div className="app-root">
      <header className="sd-topbar">
        <Link to="/skill-development" className="sd-logo">
          Skill<span className="sd-logo-accent">Dev</span>
        </Link>
        <nav className="sd-nav">
          <NavLink to="/skill-development" end>
            Courses
          </NavLink>
          {isAuthenticated && role === 'organizer' && (
            <NavLink to="/organizer/profile" end>
              My courses
            </NavLink>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" end>
                Login
              </NavLink>
              <NavLink to="/register" end className="nav-highlight">
                Register
              </NavLink>
            </>
          ) : (
            <button type="button" className="sd-logout" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="sd-main">{children}</main>
      <footer className="sd-footer">
        <span>Internship Finder · Skill Development</span>
      </footer>
    </div>
  );
};

export default AppLayout;
