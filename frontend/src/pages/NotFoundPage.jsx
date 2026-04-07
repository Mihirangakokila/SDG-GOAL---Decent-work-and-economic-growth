import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="font-display font-extrabold text-[120px] leading-none text-slate-100 select-none">
        404
      </div>
      <div className="-mt-6">
        <h1 className="font-display font-bold text-2xl text-navy-900 mb-3">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary"><Home size={15} /> Go Home</Link>
          <Link to="/internships" className="btn-secondary"><Search size={15} /> Browse Jobs</Link>
        </div>
      </div>
    </div>
  )
}
