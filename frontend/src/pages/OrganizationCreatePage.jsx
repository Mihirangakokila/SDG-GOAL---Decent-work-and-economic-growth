import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const pageShellClass = 'max-w-7xl mx-auto px-4 sm:px-6 py-10'

const ORGANIZATION_TYPE_OPTIONS = [
  'Company',
  'Startup',
  'NGO',
  'Government',
  'Educational Institution',
]

const INDUSTRY_OPTIONS = [
  'Information Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Engineering',
  'Marketing',
  'Construction',
  'Retail',
  'Other',
]

const INTERNSHIP_LOCATION_OPTIONS = ['On-site', 'Remote', 'Hybrid']
const PHONE_BLOCKED_CHARS_RE = /[^0-9+\-()\s]/g
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateOrganizationForm = (form) => {
  const errs = []
  if (!form.organizationName?.trim()) errs.push('Organization name is required.')
  if (!form.contactNumber?.trim()) errs.push('Contact number is required.')
  else {
    const t = form.contactNumber.trim()
    if (!/^[\d\s+().-]+$/.test(t)) {
      errs.push('Contact number should only include numbers and common symbols (+, spaces, brackets, dashes).')
    } else if ((t.match(/\d/g) || []).length < 8) {
      errs.push('Contact number should include at least 8 digits.')
    }
  }
  if (!form.industry?.trim()) errs.push('Please select an industry.')
  if (!form.organizationType?.trim()) errs.push('Please select an organization type.')
  if (!form.location?.trim()) errs.push('Location is required.')
  if (!form.description?.trim()) errs.push('Description is required.')
  if (!form.internshipLocationType?.trim()) errs.push('Please select an internship location type.')
  if (form.email != null && String(form.email).trim() && !EMAIL_RE.test(String(form.email).trim())) {
    errs.push('Please enter a valid email address.')
  }
  const web = form.website?.trim()
  if (web) {
    try {
      const withProto = web.includes('://') ? web : `https://${web}`
      void new URL(withProto)
    } catch {
      errs.push('Please enter a valid website URL (for example https://example.com).')
    }
  }
  return errs
}

export default function OrganizationCreatePage() {
  const navigate = useNavigate()
  const { isOrg } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    organizationName: '',
    contactNumber: '',
    industry: '',
    organizationType: '',
    location: '',
    description: '',
    website: '',
    offersRemoteInternships: false,
    internshipLocationType: '',
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const checkExisting = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/organizations')
      const list = res.data?.organizations
      if (Array.isArray(list) && list.length > 0) {
        navigate('/organization', { replace: true })
        return
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not verify organization profile.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!isOrg) {
      navigate('/', { replace: true })
      return
    }
    checkExisting()
  }, [isOrg, navigate, checkExisting])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationErrors = validateOrganizationForm(form)
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      toast.error(validationErrors[0])
      return
    }
    setSubmitting(true)
    try {
      await api.post('/organizations', {
        organizationName: form.organizationName.trim(),
        contactNumber: form.contactNumber.trim(),
        industry: form.industry.trim(),
        organizationType: form.organizationType.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
        offersRemoteInternships: form.offersRemoteInternships,
        internshipLocationType: form.internshipLocationType,
      })
      toast.success('Organization profile created.')
      navigate('/organization', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to create organization profile.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOrg) return null

  if (loading) {
    return (
      <div className={pageShellClass}>
        <div className="card p-12 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-brand" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className="mb-8">
        <h1 className="section-title">Create Organization Profile</h1>
      </div>
      <div className="card p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">{error}</p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Organization name</label>
              <input
                className="input"
                value={form.organizationName}
                onChange={(e) => set('organizationName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Contact number</label>
              <input
                className="input"
                value={form.contactNumber}
                onChange={(e) => set('contactNumber', e.target.value.replace(PHONE_BLOCKED_CHARS_RE, ''))}
                inputMode="tel"
                placeholder="+94 77 123 4567"
                required
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)} required>
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Organization type</label>
              <select
                className="input"
                value={form.organizationType}
                onChange={(e) => set('organizationType', e.target.value)}
                required
              >
                <option value="">Select organization type</option>
                {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[100px] resize-y"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Website (optional)</label>
              <input className="input" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Internship location type</label>
              <select
                className="input"
                value={form.internshipLocationType}
                onChange={(e) => set('internshipLocationType', e.target.value)}
                required
              >
                <option value="">Select internship location type</option>
                {INTERNSHIP_LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input
                id="offersRemoteInternships"
                type="checkbox"
                checked={form.offersRemoteInternships}
                onChange={(e) => set('offersRemoteInternships', e.target.checked)}
                className="rounded border-slate-300 text-brand focus:ring-brand"
              />
              <label htmlFor="offersRemoteInternships" className="text-sm text-slate-700">
                Offers remote internships
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              'Create profile'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
