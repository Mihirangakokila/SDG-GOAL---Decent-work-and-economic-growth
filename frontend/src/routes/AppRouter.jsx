import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import SkillDevelopmentPage from '../pages/SkillDevelopmentPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import OrganizerProfilePage from '../pages/OrganizerProfilePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const AppRouter = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/skill-development" replace />} />
      <Route path="/skill-development" element={<SkillDevelopmentPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
        <Route path="/organizer/profile" element={<OrganizerProfilePage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </AppLayout>
);

export default AppRouter;
