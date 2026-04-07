import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const PrivateRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export const OrgRoute = () => {
  const { user, loading, isOrg } = useAuth()
  if (loading) return null
  if (!user)   return <Navigate to="/login" replace />
  if (!isOrg)  return <Navigate to="/"      replace />
  return <Outlet />
}

const Spinner = () => (
  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
)
