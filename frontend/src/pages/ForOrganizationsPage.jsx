import { Link } from 'react-router-dom'
import { Building2, Users, BarChart3, Mail, ArrowRight } from 'lucide-react'

const perks = [
  { icon: Users, title: 'Reach motivated youth', desc: 'Post internships and skill-development courses in one place.' },
  { icon: BarChart3, title: 'Track performance', desc: 'Dashboards for listings, views, and applications.' },
  { icon: Mail, title: 'Stay in touch', desc: 'Email notifications for applications and weekly digests when configured.' },
]

export default function ForOrganizationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 text-brand mb-6">
          <Building2 size={28} />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-navy-900 mb-4">
          InternHub for organizations
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Publish internships, manage your company profile, and offer courses on the Skill Development hub.
          Create an account as an <strong className="text-navy-800">Organization</strong> to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            to="/register?role=organization"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            Register as organization <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary inline-flex items-center justify-center">
            Sign in
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {perks.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand mb-4">
              <Icon size={20} />
            </div>
            <h2 className="font-display font-semibold text-lg text-navy-900 mb-2">{title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500 mt-12">
        Already have a youth account?{' '}
        <Link to="/register" className="text-brand font-medium hover:underline">
          Register separately
        </Link>{' '}
        or{' '}
        <Link to="/" className="text-brand font-medium hover:underline">
          return home
        </Link>
        .
      </p>
    </div>
  )
}
