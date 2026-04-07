import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import { Briefcase, User, Building2, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  // Backend roles: 'youth' | 'organization'
  const [role,    setRole]    = useState('youth')
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Backend POST /auth/register expects: { name, email, password, role }
    const payload = {
      name:     form.name.trim(),
      email:    form.email.trim(),
      password: form.password,
      role,
    }

    setLoading(true)
    try {
      const res = await authAPI.register(payload)
      // Backend returns: { message, user: { id, name, email, role }, token }
      const { token, user } = res.data
      login(user, token)
      toast.success('Account created! Welcome to InternHub!')
      navigate(user.role === 'organization' ? '/dashboard' : '/internships')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const isOrg = role === 'organization'

  const perks = isOrg
    ? ['Post unlimited internships', 'Access applicant dashboard', 'Receive email notifications', 'Track views & applications']
    : ['Browse 2,400+ internships', 'Filter by skill & location', 'Save favourite listings', 'Get matched to opportunities']

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 items-center justify-center p-14 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-xs">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mb-6">
            <Briefcase size={24} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-3">
            Join InternHub {isOrg ? 'as an Organization' : 'as a Youth'}
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            {isOrg
              ? 'Find talented interns and grow your team with the right people.'
              : 'Kick-start your career with hands-on experience at top companies.'}
          </p>
          <div className="space-y-3">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-navy-900 mb-2">Create account</h1>
            <p className="text-slate-500 text-sm">
              Already have one?{' '}
              <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-7 p-1 bg-slate-100 rounded-xl">
            {[
              { value: 'youth',        label: 'Youth / Student', icon: User      },
              { value: 'organization', label: 'Organization',    icon: Building2 },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setRole(value)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === value
                    ? 'bg-white shadow-sm text-navy-900 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* name is required by backend for ALL roles */}
            <div>
              <label className="label">{isOrg ? 'Organization Name' : 'Full Name'}</label>
              <input
                type="text"
                placeholder={isOrg ? 'Acme Corp.' : 'John Smith'}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)}
                required className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  required className="input pr-10" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                required className="input" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <>Create Account <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            By registering you agree to our{' '}
            <a href="#" className="text-slate-600 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-slate-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
