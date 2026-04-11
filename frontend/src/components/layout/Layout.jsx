import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import OrgAccountPoller from './OrgAccountPoller'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <OrgAccountPoller />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
