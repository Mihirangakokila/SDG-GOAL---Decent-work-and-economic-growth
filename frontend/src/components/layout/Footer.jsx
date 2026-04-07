import { Link } from 'react-router-dom'
import { Briefcase, Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <Briefcase size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Intern<span className="text-brand-light">Hub</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Connecting ambitious students with organizations that are shaping the future.
              Start your career journey today.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand/30 hover:text-white transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 font-display">For Students</h4>
            <ul className="space-y-2.5 text-sm">
              {['Browse Internships','Search by Skill','By Location','Recent Listings'].map(l => (
                <li key={l}><Link to="/internships" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4 font-display">For Organizations</h4>
            <ul className="space-y-2.5 text-sm">
              {['Post an Internship','Dashboard','Manage Listings','Register'].map(l => (
                <li key={l}><Link to="/register" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} InternHub. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
