import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import { PrivateRoute, OrgRoute, AdminRoute } from './components/common/PrivateRoute'

// Pages
import HomePage             from './pages/HomePage'
import InternshipsPage      from './pages/InternshipsPage'
import InternshipDetailPage from './pages/InternshipDetailPage'
import DashboardPage        from './pages/DashboardPage'
import PostInternshipPage        from './pages/PostInternshipPage'
import InternshipAnalyticsPage   from './pages/InternshipAnalyticsPage'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import NotFoundPage         from './pages/NotFoundPage'
import ProfilePage          from './pages/ProfilePage'
import CreateProfilePage    from './pages/CreateProfilePage'
import OrganizationProfilePage from './pages/OrganizationProfilePage'
import OrganizationCreatePage  from './pages/OrganizationCreatePage'
import AdminOrganizationsPage  from './pages/AdminOrganizationsPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px 0 rgb(0 0 0 / 0.08)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/"               element={<HomePage />} />
          <Route path="/internships"    element={<InternshipsPage />} />
          <Route path="/internships/:id" element={<InternshipDetailPage />} />
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />

          {/* Organization-only routes */}
          <Route element={<OrgRoute />}>
            <Route path="/dashboard"               element={<DashboardPage />} />
            <Route path="/dashboard/post"          element={<PostInternshipPage />} />
            <Route path="/dashboard/edit/:id"      element={<PostInternshipPage />} />
            <Route path="/dashboard/analytics/:id" element={<InternshipAnalyticsPage />} />
            <Route path="/organization"            element={<OrganizationProfilePage />} />
            <Route path="/organization/create"     element={<OrganizationCreatePage />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/create" element={<CreateProfilePage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
