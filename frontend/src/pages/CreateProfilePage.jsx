import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const pageShellClass = 'max-w-7xl mx-auto px-4 sm:px-6 py-10'
const PHONE_BLOCKED_CHARS_RE = /[^0-9+\-()\s]/g
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyYouthFormValues() {
  return {
    fullName: '',
    contactNumber: '',
    DOB: '',
    gender: '',
    district: '',
    provinceOrState: '',
    highestQualification: '',
    institutionName: '',
    fieldOfStudy: '',
    graduationYear: '',
    technicalSkillsStr: '',
    softSkillsStr: '',
    experienceYears: '0',
    digitalLiteracyLevel: 'medium',
    preferredInternshipType: 'any',
    transportationAvailability: false,
    profileVisibility: 'public',
    internetAccess: false,
    ruralAreaFlag: false,
  }
}

export function profileToFormValues(profile) {
  const edu = profile?.education || {}
  let dob = profile?.DOB ?? ''
  if (typeof dob === 'string' && dob.includes('T')) dob = dob.slice(0, 10)
  return {
    fullName: profile?.fullName ?? '',
    contactNumber: profile?.contactNumber ?? '',
    DOB: dob,
    gender: profile?.gender ?? '',
    district: profile?.district ?? '',
    provinceOrState: profile?.provinceOrState ?? '',
    highestQualification: edu.highestQualification ?? '',
    institutionName: edu.institutionName ?? '',
    fieldOfStudy: edu.fieldOfStudy ?? '',
    graduationYear: edu.graduationYear != null ? String(edu.graduationYear) : '',
    technicalSkillsStr: Array.isArray(profile?.technicalSkills) ? profile.technicalSkills.join(', ') : '',
    softSkillsStr: Array.isArray(profile?.softSkills) ? profile.softSkills.join(', ') : '',
    experienceYears:
      profile?.experienceYears != null && profile.experienceYears !== '' ? String(profile.experienceYears) : '0',
    digitalLiteracyLevel: profile?.digitalLiteracyLevel ?? 'medium',
    preferredInternshipType: profile?.preferredInternshipType ?? 'any',
    transportationAvailability: Boolean(profile?.transportationAvailability),
    profileVisibility: profile?.profileVisibility ?? 'public',
    internetAccess: Boolean(profile?.internetAccess),
    ruralAreaFlag: Boolean(profile?.ruralAreaFlag),
  }
}

export function formValuesToApiBody(form) {
  return {
    fullName: form.fullName.trim(),
    contactNumber: form.contactNumber.trim(),
    DOB: form.DOB,
    gender: form.gender || undefined,
    district: form.district.trim(),
    provinceOrState: form.provinceOrState.trim(),
    highestQualification: form.highestQualification.trim(),
    institutionName: form.institutionName.trim(),
    fieldOfStudy: form.fieldOfStudy.trim(),
    graduationYear: form.graduationYear === '' ? undefined : Number(form.graduationYear),
    technicalSkills: form.technicalSkillsStr.split(',').map((s) => s.trim()).filter(Boolean),
    softSkills: form.softSkillsStr.split(',').map((s) => s.trim()).filter(Boolean),
    experienceYears: form.experienceYears === '' ? 0 : Number(form.experienceYears) || 0,
    digitalLiteracyLevel: form.digitalLiteracyLevel,
    preferredInternshipType: form.preferredInternshipType,
    transportationAvailability: form.transportationAvailability,
    profileVisibility: form.profileVisibility,
    internetAccess: form.internetAccess,
    ruralAreaFlag: form.ruralAreaFlag,
  }
}

export function YouthProfileForm({
  initialValues,
  onSubmit,
  submitLabel = 'Save',
  submitting = false,
  error = '',
  showCancel = false,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues)
  const [clientError, setClientError] = useState('')

  useEffect(() => {
    setForm(initialValues)
  }, [initialValues])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleaned = String(form.contactNumber || '').trim()
    if (cleaned.length === 0) {
      const msg = 'Contact number is required.'
      setClientError(msg)
      toast.error(msg)
      return
    }
    if (/[^0-9+\-()\s]/.test(cleaned)) {
      const msg = 'Contact number can only contain numbers and + - ( ) symbols.'
      setClientError(msg)
      toast.error(msg)
      return
    }
    const digits = (cleaned.match(/\d/g) || []).length
    if (digits < 8) {
      const msg = 'Contact number must contain at least 8 digits.'
      setClientError(msg)
      toast.error(msg)
      return
    }
    if (form.email != null && String(form.email).trim() && !EMAIL_RE.test(String(form.email).trim())) {
      const msg = 'Please enter a valid email address.'
      setClientError(msg)
      toast.error(msg)
      return
    }
    setClientError('')
    await onSubmit(formValuesToApiBody(form))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {clientError ? <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">{clientError}</p> : null}
      {error ? <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-4 py-3">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
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
          <label className="label">Date of birth</label>
          <input className="input" type="date" value={form.DOB} onChange={(e) => set('DOB', e.target.value)} required />
        </div>
        <div>
          <label className="label">District</label>
          <input className="input" value={form.district} onChange={(e) => set('district', e.target.value)} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Province or state</label>
          <input className="input" value={form.provinceOrState} onChange={(e) => set('provinceOrState', e.target.value)} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="text-sm font-semibold text-navy-900 mb-3">Education</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Highest qualification</label>
            <input className="input" value={form.highestQualification} onChange={(e) => set('highestQualification', e.target.value)} />
          </div>
          <div>
            <label className="label">Institution name</label>
            <input className="input" value={form.institutionName} onChange={(e) => set('institutionName', e.target.value)} />
          </div>
          <div>
            <label className="label">Field of study</label>
            <input className="input" value={form.fieldOfStudy} onChange={(e) => set('fieldOfStudy', e.target.value)} />
          </div>
          <div>
            <label className="label">Graduation year</label>
            <input
              className="input"
              type="number"
              min="1950"
              max="2100"
              value={form.graduationYear}
              onChange={(e) => set('graduationYear', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Technical skills (comma-separated)</label>
          <input
            className="input"
            placeholder="e.g. React, Node.js, Python"
            value={form.technicalSkillsStr}
            onChange={(e) => set('technicalSkillsStr', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Soft skills (comma-separated)</label>
          <input
            className="input"
            placeholder="e.g. Communication, Teamwork"
            value={form.softSkillsStr}
            onChange={(e) => set('softSkillsStr', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Experience (years)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.5"
            value={form.experienceYears}
            onChange={(e) => set('experienceYears', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Digital literacy</label>
          <select
            className="input"
            value={form.digitalLiteracyLevel}
            onChange={(e) => set('digitalLiteracyLevel', e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label">Preferred internship type</label>
          <select
            className="input"
            value={form.preferredInternshipType}
            onChange={(e) => set('preferredInternshipType', e.target.value)}
          >
            <option value="any">Any</option>
            <option value="remote">Remote</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Profile visibility</label>
          <select className="input" value={form.profileVisibility} onChange={(e) => set('profileVisibility', e.target.value)}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2">
          <input
            id="transportationAvailability"
            type="checkbox"
            checked={form.transportationAvailability}
            onChange={(e) => set('transportationAvailability', e.target.checked)}
            className="rounded border-slate-300 text-brand focus:ring-brand"
          />
          <label htmlFor="transportationAvailability" className="text-sm text-slate-700">
            I have transportation available
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="internetAccess"
            type="checkbox"
            checked={form.internetAccess}
            onChange={(e) => set('internetAccess', e.target.checked)}
            className="rounded border-slate-300 text-brand focus:ring-brand"
          />
          <label htmlFor="internetAccess" className="text-sm text-slate-700">
            I have reliable internet access
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="ruralAreaFlag"
            type="checkbox"
            checked={form.ruralAreaFlag}
            onChange={(e) => set('ruralAreaFlag', e.target.checked)}
            className="rounded border-slate-300 text-brand focus:ring-brand"
          />
          <label htmlFor="ruralAreaFlag" className="text-sm text-slate-700">
            I live in a rural area
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
        {showCancel && onCancel ? (
          <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary disabled:opacity-50">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default function CreateProfilePage() {
  const navigate = useNavigate()
  const { user, isOrg, isAdmin } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  const userId = useMemo(() => user?._id ?? user?.id ?? null, [user])

  const initialValues = useMemo(() => emptyYouthFormValues(), [])

  const checkExisting = useCallback(async () => {
    if (!userId) {
      setChecking(false)
      return
    }
    try {
      await api.get(`/profile/${userId}`)
      navigate('/profile', { replace: true })
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.message ?? 'Could not verify profile status.')
      }
    } finally {
      setChecking(false)
    }
  }, [userId, navigate])

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/organizations', { replace: true })
      return
    }
    if (isOrg) {
      navigate('/', { replace: true })
      return
    }
    checkExisting()
  }, [isAdmin, isOrg, navigate, checkExisting])

  const handleCreate = async (body) => {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/profile', body)
      toast.success('Profile created successfully.')
      navigate('/profile', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to create profile.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (isOrg || isAdmin) return null

  if (checking) {
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
        <h1 className="section-title">Create your profile</h1>
        <p className="text-sm text-slate-500 mt-1">Add your details so we can tailor opportunities and track your readiness.</p>
      </div>
      <div className="card p-6 max-w-3xl">
        <YouthProfileForm
          initialValues={initialValues}
          onSubmit={handleCreate}
          submitLabel="Create profile"
          submitting={submitting}
          error={error}
        />
      </div>
    </div>
  )
}
