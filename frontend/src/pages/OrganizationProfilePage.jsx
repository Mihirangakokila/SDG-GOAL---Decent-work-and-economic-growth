import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Building2, Lightbulb, FileText, Upload, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
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
// Backend currently uses default JSON parser size; base64 payloads must stay very small.
const MAX_SAFE_BASE64_UPLOAD_BYTES = 70 * 1024
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

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const computeFrontendReadiness = (org) => {
  const docs = Array.isArray(org?.documents) ? org.documents : []
  const checks = [
    {
      key: 'verified',
      label: 'Admin verification completed',
      pass: org?.verified === true || org?.verified === 'true',
      points: 40,
    },
    {
      key: 'docs',
      label: 'Verification documents uploaded',
      pass: docs.length > 0,
      points: 25,
    },
    {
      key: 'website',
      label: 'Website provided',
      pass: Boolean(org?.website?.trim?.()),
      points: 10,
    },
    {
      key: 'description',
      label: 'Detailed description provided',
      pass: (org?.description?.trim?.().length || 0) >= 60,
      points: 10,
    },
    {
      key: 'internshipType',
      label: 'Internship location type selected',
      pass: Boolean(org?.internshipLocationType?.trim?.()),
      points: 15,
    },
  ]

  const score = checks.reduce((sum, c) => sum + (c.pass ? c.points : 0), 0)
  const status = score >= 85 ? 'READY' : score >= 60 ? 'IN_PROGRESS' : 'DRAFT'
  const missing = checks.filter((c) => !c.pass).map((c) => c.label)
  return { score, status, missing }
}

const orgToForm = (org) => ({
  organizationName: org?.organizationName ?? '',
  contactNumber: org?.contactNumber ?? '',
  industry: org?.industry ?? '',
  organizationType: org?.organizationType ?? '',
  location: org?.location ?? '',
  description: org?.description ?? '',
  website: org?.website ?? '',
  offersRemoteInternships: Boolean(org?.offersRemoteInternships),
  internshipLocationType: org?.internshipLocationType ?? '',
})

function OrganizationEditForm({ initial, onSubmit, submitting, error, onCancel }) {
  const [form, setForm] = useState(initial)
  useEffect(() => {
    setForm(initial)
  }, [initial])
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="space-y-5"
    >
      {error ? (
        <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">{error}</p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Organization name</label>
          <input className="input" value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)} required />
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
            {form.industry && !INDUSTRY_OPTIONS.includes(form.industry) ? (
              <option value={form.industry}>{form.industry}</option>
            ) : null}
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
            {form.organizationType && !ORGANIZATION_TYPE_OPTIONS.includes(form.organizationType) ? (
              <option value={form.organizationType}>{form.organizationType}</option>
            ) : null}
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
            {form.internshipLocationType && !INTERNSHIP_LOCATION_OPTIONS.includes(form.internshipLocationType) ? (
              <option value={form.internshipLocationType}>{form.internshipLocationType}</option>
            ) : null}
            {INTERNSHIP_LOCATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-7">
          <input
            id="edit-offersRemote"
            type="checkbox"
            checked={form.offersRemoteInternships}
            onChange={(e) => set('offersRemoteInternships', e.target.checked)}
            className="rounded border-slate-300 text-brand focus:ring-brand"
          />
          <label htmlFor="edit-offersRemote" className="text-sm text-slate-700">
            Offers remote internships
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            'Save changes'
          )}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary disabled:opacity-50">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function OrganizationProfilePage() {
  const { isOrg } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [docFile, setDocFile] = useState(null)
  const [docType, setDocType] = useState('verification')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [orgNotifications, setOrgNotifications] = useState([])

  const loadOrganizations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/organizations')
      const list = res.data?.organizations
      const next = Array.isArray(list) && list.length > 0 ? list[0] : null
      setOrg(next)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to load organization profile.')
      setOrg(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOrg) {
      navigate('/', { replace: true })
      return
    }
    loadOrganizations(false)
  }, [isOrg, navigate, loadOrganizations])

  useEffect(() => {
    if (!isOrg) return
    const onOrgAccount = (e) => {
      const kind = e.detail?.kind
      if (kind === 'verified') {
        setOrgNotifications((n) => [
          ...n,
          { id: Date.now(), text: 'Your organization has been verified' },
        ])
        void loadOrganizations(true)
      }
      if (kind === 'removed') {
        setOrgNotifications((n) => [
          ...n,
          { id: Date.now(), text: 'Your organization profile has been removed' },
        ])
        void loadOrganizations(true)
      }
    }
    window.addEventListener('internhub:org-account', onOrgAccount)
    return () => window.removeEventListener('internhub:org-account', onOrgAccount)
  }, [isOrg, loadOrganizations])

  const orgId = org?._id ?? org?.id
  const editInitial = useMemo(() => (org ? orgToForm(org) : null), [org])

  const handleSaveEdit = async (form) => {
    if (!orgId) return
    setSaveError('')
    const validationErrors = validateOrganizationForm(form)
    if (validationErrors.length > 0) {
      setSaveError(validationErrors.join(' '))
      toast.error(validationErrors[0])
      return
    }
    setSaving(true)
    try {
      await api.put(`/organizations/${orgId}`, {
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
      toast.success('Organization profile updated.')
      setEditMode(false)
      await loadOrganizations()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Update failed.'
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!orgId) return
    if (!window.confirm('Delete your organization profile? This cannot be undone.')) return
    ;(async () => {
      try {
        await api.delete(`/organizations/${orgId}`)
        toast.success('Organization profile deleted.')
        navigate('/')
      } catch (err) {
        toast.error(err.response?.data?.message ?? 'Delete failed.')
      }
    })()
  }

  const handleDocUpload = async () => {
    if (!orgId || !docFile) {
      toast.error('Please select a file.')
      return
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    const okMime = allowed.includes(docFile.type)
    const okExt = /\.(pdf|png|jpe?g)$/i.test(docFile.name)
    if (!okMime && !okExt) {
      toast.error('Only PDF and image files are allowed.')
      return
    }
    if (docFile.size > MAX_SAFE_BASE64_UPLOAD_BYTES) {
      toast.error('File is too large for current server limit. Please use a file under 70KB for now.')
      return
    }
    let url = ''
    try {
      url = await fileToDataUrl(docFile)
    } catch {
      toast.error('Failed to read file.')
      return
    }
    setUploadingDoc(true)
    try {
      await api.post(`/organizations/${orgId}/documents`, {
        fileName: docFile.name,
        url,
        sizeInBytes: docFile.size,
        type: docType.trim() || undefined,
      })
      toast.success('Document uploaded.')
      setDocFile(null)
      await loadOrganizations()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Upload failed.')
    } finally {
      setUploadingDoc(false)
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

  if (!org) {
    return (
      <div className={pageShellClass}>
        <div className="card p-8 max-w-xl mx-auto text-center">
          <h1 className="section-title">Create Organization Profile</h1>
          <button type="button" onClick={() => navigate('/organization/create')} className="btn-primary mt-6">
            Create Organization Profile
          </button>
        </div>
      </div>
    )
  }

  const documents = Array.isArray(org.documents) ? org.documents : []
  const readinessSuggestions = Array.isArray(org.readinessSuggestions) ? org.readinessSuggestions : []
  const readiness = computeFrontendReadiness(org)
  const websiteHref = org.website?.trim()
    ? org.website.startsWith('http')
      ? org.website
      : `https://${org.website}`
    : ''

  return (
    <div className={pageShellClass}>
      {orgNotifications.length > 0 ? (
        <div className="card p-4 mb-6">
          <h2 className="font-display font-bold text-sm text-navy-900 mb-2">Notifications</h2>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            {orgNotifications.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
        <div>
          <h1 className="section-title">Organization Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Readiness and profile management</p>
        </div>
        {!editMode ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditMode(true)} className="btn-secondary text-sm">
              Edit Profile
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete Profile
            </button>
          </div>
        ) : null}
      </div>

      {editMode && editInitial ? (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-navy-900 mb-4">Edit organization</h2>
          <OrganizationEditForm
            initial={editInitial}
            onSubmit={handleSaveEdit}
            submitting={saving}
            error={saveError}
            onCancel={() => {
              setEditMode(false)
              setSaveError('')
            }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <h2 className="font-display font-bold text-lg text-navy-900">Organization Info</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Name</dt>
              <dd className="text-navy-900 font-medium mt-0.5">{org.organizationName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Industry</dt>
              <dd className="text-slate-700 mt-0.5">{org.industry || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Location</dt>
              <dd className="text-slate-700 mt-0.5">{org.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Description</dt>
              <dd className="text-slate-700 mt-0.5 whitespace-pre-wrap">{org.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Website</dt>
              <dd className="mt-0.5">
                {websiteHref ? (
                  <a href={websiteHref} target="_blank" rel="noreferrer" className="text-brand font-medium hover:underline inline-flex items-center gap-1">
                    {org.website} <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-slate-700">Website: Not provided</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="font-display font-bold text-lg text-navy-900 mb-5">Readiness status</h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Readiness Score</p>
              <p className="text-2xl font-display font-bold text-brand mt-1">{readiness.score}%</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Readiness status</p>
              <p className="mt-1">
                {readiness.status === 'READY' ? (
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    READY
                  </span>
                ) : readiness.status === 'IN_PROGRESS' ? (
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                    IN PROGRESS
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    DRAFT
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Can post internship</p>
              <p className="mt-1">
                {(() => {
                  const profileCompleteness = Math.min(
                    100,
                    Math.max(0, Number(org.profileCompleteness ?? org.profileCompletenessPercentage) || 0)
                  )
                  const isVerified = org.verified === true || org.verified === 'true'
                  const canPostFromApi =
                    org.canPostInternship === true || org.canPostInternship === 'true'
                  // Align with Current Status: posting is available when API allows, or while under review / incomplete / fully complete (same messaging as status section).
                  const postingAllowed =
                    canPostFromApi ||
                    !isVerified ||
                    profileCompleteness < 100 ||
                    (isVerified && profileCompleteness >= 100)
                  return postingAllowed ? (
                    <span className="badge-green px-3 py-1">Currently allowed</span>
                  ) : (
                    <span className="badge-red px-3 py-1">Not Allowed</span>
                  )
                })()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Missing for better readiness</p>
              {readiness.missing.length === 0 ? (
                <p className="mt-1 text-sm text-emerald-700 font-medium">All readiness checks completed.</p>
              ) : (
                <ul className="mt-2 list-disc list-inside text-slate-600 space-y-1">
                  {readiness.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Verified</p>
              <p className="mt-1">
                {org.verified === true || org.verified === 'true' ? (
                  <span className="badge-green px-3 py-1">Verified</span>
                ) : (
                  <span className="badge-red px-3 py-1">Not Verified</span>
                )}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-6 mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-lg text-navy-900">Current Status</h2>
        </div>
        {(() => {
          const profileCompleteness = Math.min(
            100,
            Math.max(0, Number(org.profileCompleteness ?? org.profileCompletenessPercentage) || 0)
          )
          const isVerified = org.verified === true || org.verified === 'true'

          if (!isVerified) {
            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Your organization is under review.</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      You can still post internships, but verification will improve trust and visibility.
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          if (profileCompleteness < 100) {
            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Your profile is not fully complete.</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      You can still post internships, but completing your profile will improve visibility.
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Your organization is fully verified and ready to post internships.
                  </p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    You can post internships and fully use the platform.
                  </p>
                </div>
              </div>
            </div>
          )
        })()}
      </section>

      <section className="card p-6 mt-6">
        <h2 className="font-display font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
          <Lightbulb size={17} className="text-amber-500" />
          Suggestions
        </h2>
        {readinessSuggestions.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2 marker:text-brand">
            {readinessSuggestions.map((item, idx) => (
              <li key={`${item}-${idx}`} className="text-sm text-slate-600 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No suggestions available at the moment.</p>
        )}
      </section>

      <section className="card p-6 mt-6">
        <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
          <FileText size={17} className="text-navy-700" />
          Organization Documents
        </h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mb-5">
          <label className="block text-sm font-semibold text-navy-900 mb-2">Upload document</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Document type</label>
              <input className="input" value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g. verification" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
            />
            <button
              type="button"
              onClick={handleDocUpload}
              disabled={!docFile || uploadingDoc}
              className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingDoc ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">PDF or images up to 5MB (per server rules).</p>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div
                key={`${doc.fileName}-${idx}`}
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-navy-900">{doc.fileName || '—'}</p>
                  <p className="text-xs text-slate-500">
                    Type: {doc.type || '—'} · Uploaded {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                  >
                    View <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
