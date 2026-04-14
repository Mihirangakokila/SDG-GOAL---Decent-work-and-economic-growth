import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2,
  UserCircle2,
  Wrench,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { YouthProfileForm, profileToFormValues } from './CreateProfilePage'

const pageShellClass = 'max-w-7xl mx-auto px-4 sm:px-6 py-10'

const getStrengthConfig = (level) => {
  const normalized = String(level || '').toLowerCase()
  if (normalized === 'high') {
    return { label: 'High', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  }
  if (normalized === 'medium') {
    return { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  if (normalized === 'low') {
    return { label: 'Low', className: 'bg-red-50 text-red-700 border-red-200' }
  }
  return { label: 'Unknown', className: 'bg-slate-50 text-slate-700 border-slate-200' }
}

const formatDate = (value) => {
  if (!value) return 'Unknown date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Unknown date'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatFileSize = (bytes) => {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return 'Unknown size'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const CV_HIDDEN_STORAGE_PREFIX = 'internhub_hidden_cv_'

const cvFingerprint = (doc) => {
  const t = doc?.uploadedAt ? new Date(doc.uploadedAt).toISOString() : ''
  return `${doc?.fileName || ''}|${t}|${doc?.sizeInBytes ?? ''}`
}

const readHiddenCvKeys = (userId) => {
  if (!userId || typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`${CV_HIDDEN_STORAGE_PREFIX}${userId}`)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

const writeHiddenCvKeys = (userId, keysSet) => {
  if (!userId || typeof localStorage === 'undefined') return
  localStorage.setItem(`${CV_HIDDEN_STORAGE_PREFIX}${userId}`, JSON.stringify([...keysSet]))
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

const buildRoadmap = (profile) => {
  const technicalSkills = Array.isArray(profile?.technicalSkills) ? profile.technicalSkills : []
  const softSkills = Array.isArray(profile?.softSkills) ? profile.softSkills : []
  const completeness = Number(profile?.profileCompleteness) || 0

  const steps = [
    {
      key: 'basic',
      label: 'Basic Profile Info',
      completed: Boolean(profile?.fullName?.trim?.()),
      nextMessage: 'Complete your basic profile info.',
    },
    {
      key: 'technical',
      label: 'Technical Skills',
      completed: technicalSkills.length >= 2,
      nextMessage: 'Add at least 2 technical skills.',
    },
    {
      key: 'soft',
      label: 'Soft Skills',
      completed: softSkills.length >= 2,
      nextMessage: 'Improve Soft Skills by adding at least 2.',
    },
    {
      key: 'readiness',
      label: 'Profile Readiness',
      completed: completeness >= 80,
      nextMessage: 'Increase profile completeness to at least 80%.',
    },
  ]

  const nextStep = steps.find((step) => !step.completed) || null
  return { steps, nextStep }
}

const scrollToProfileSection = (id) => {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleRoadmapStepNavigate = (stepKey) => {
  if (stepKey === 'technical') scrollToProfileSection('profile-skills-technical')
  else if (stepKey === 'soft') scrollToProfileSection('profile-skills-soft')
  else scrollToProfileSection('profile-overview')
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) navigate('/admin/organizations', { replace: true })
  }, [isAdmin, navigate])

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [profileMissing, setProfileMissing] = useState(false)
  const [techSkillInput, setTechSkillInput] = useState('')
  const [softSkillInput, setSoftSkillInput] = useState('')
  const [skillBusy, setSkillBusy] = useState(false)
  const [hiddenCvKeys, setHiddenCvKeys] = useState(() => new Set())

  const userId = useMemo(() => user?._id ?? user?.id ?? null, [user])

  useEffect(() => {
    if (!userId) {
      setHiddenCvKeys(new Set())
      return
    }
    setHiddenCvKeys(readHiddenCvKeys(userId))
  }, [userId])

  const editFormValues = useMemo(() => (profile ? profileToFormValues(profile) : null), [profile])

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setError('No logged-in user found.')
      setProfileMissing(false)
      return
    }

    setLoading(true)
    setError('')
    setProfileMissing(false)
    try {
      const res = await api.get(`/profile/${userId}`)
      setProfile(res.data?.profile ?? null)
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null)
        setProfileMissing(true)
      } else {
        const message = err.response?.data?.message ?? 'Failed to load profile.'
        setError(message)
        setProfile(null)
        setProfileMissing(false)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!userId) return
    if (!selectedFile) {
      toast.error('Please select a file first.')
      return
    }

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const isAllowedMime = allowed.includes(selectedFile.type)
    const isAllowedExt = /\.(pdf|doc|docx)$/i.test(selectedFile.name)

    if (!isAllowedMime && !isAllowedExt) {
      toast.error('Only .pdf, .doc, or .docx files are allowed.')
      return
    }

    console.log(selectedFile)

    let fileDataUrl = ''
    try {
      fileDataUrl = await fileToDataUrl(selectedFile)
    } catch (err) {
      console.error(err)
      toast.error('Failed to process selected file.')
      return
    }

    const payload = {
      fileName: selectedFile.name,
      url: fileDataUrl,
      sizeInBytes: selectedFile.size,
    }

    setUploading(true)
    try {
      await api.post(`/profile/${userId}/upload-cv`, payload)
      toast.success('CV uploaded successfully.')
      setSelectedFile(null)
      await loadProfile()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message ?? 'Failed to upload CV.')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (body) => {
    if (!userId) return
    setSavingProfile(true)
    setSaveError('')
    try {
      await api.put(`/profile/${userId}`, body)
      toast.success('Profile updated.')
      setEditMode(false)
      await loadProfile()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to update profile.'
      setSaveError(msg)
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeleteProfile = () => {
    if (!userId) return
    if (!window.confirm('Are you sure you want to delete your profile? This cannot be undone.')) return
    ;(async () => {
      try {
        await api.delete(`/profile/${userId}`)
        toast.success('Profile deleted.')
        navigate('/')
      } catch (err) {
        toast.error(err.response?.data?.message ?? 'Failed to delete profile.')
      }
    })()
  }

  const patchProfileFields = async (partial) => {
    if (!userId) return false
    try {
      await api.put(`/profile/${userId}`, partial)
      await loadProfile()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Update failed.')
      return false
    }
  }

  const handleAddTechnicalSkill = async () => {
    if (!profile || !userId) return
    const name = techSkillInput.trim()
    if (!name) return
    const list = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : []
    if (list.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error('That skill is already listed.')
      return
    }
    setSkillBusy(true)
    try {
      const ok = await patchProfileFields({ technicalSkills: [...list, name] })
      if (ok) {
        setTechSkillInput('')
        toast.success('Technical skill added.')
      }
    } finally {
      setSkillBusy(false)
    }
  }

  const handleRemoveTechnicalSkill = async (index) => {
    if (!profile || !userId) return
    const list = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : []
    const next = list.filter((_, i) => i !== index)
    setSkillBusy(true)
    try {
      const ok = await patchProfileFields({ technicalSkills: next })
      if (ok) toast.success('Skill removed.')
    } finally {
      setSkillBusy(false)
    }
  }

  const handleAddSoftSkill = async () => {
    if (!profile || !userId) return
    const name = softSkillInput.trim()
    if (!name) return
    const list = Array.isArray(profile.softSkills) ? profile.softSkills : []
    if (list.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error('That skill is already listed.')
      return
    }
    setSkillBusy(true)
    try {
      const ok = await patchProfileFields({ softSkills: [...list, name] })
      if (ok) {
        setSoftSkillInput('')
        toast.success('Soft skill added.')
      }
    } finally {
      setSkillBusy(false)
    }
  }

  const handleRemoveSoftSkill = async (index) => {
    if (!profile || !userId) return
    const list = Array.isArray(profile.softSkills) ? profile.softSkills : []
    const next = list.filter((_, i) => i !== index)
    setSkillBusy(true)
    try {
      const ok = await patchProfileFields({ softSkills: next })
      if (ok) toast.success('Skill removed.')
    } finally {
      setSkillBusy(false)
    }
  }

  const handleRemoveDocument = (doc) => {
    if (!userId || !doc) return
    if (!window.confirm('Hide this file from your list on this device only?')) return
    const fp = cvFingerprint(doc)
    const next = new Set(hiddenCvKeys)
    next.add(fp)
    setHiddenCvKeys(next)
    writeHiddenCvKeys(userId, next)
    toast.success('Hidden on this browser.')
  }

  if (isAdmin) return null

  if (loading) {
    return (
      <div className={pageShellClass}>
        <div className="card p-12 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-brand" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  if (userId && !profile && profileMissing) {
    return (
      <div className={pageShellClass}>
        <div className="card p-8">
          <h1 className="section-title">Profile</h1>
          <p className="text-sm text-slate-500 mt-2">You have not created a profile yet</p>
          <button type="button" onClick={() => navigate('/profile/create')} className="btn-primary mt-5 text-sm">
            Create Profile
          </button>
        </div>
      </div>
    )
  }

  if (!userId || !profile) {
    return (
      <div className={pageShellClass}>
        <div className="card p-8">
          <h1 className="section-title">Profile</h1>
          <p className="text-sm text-slate-500 mt-2">{error || 'Profile data is unavailable.'}</p>
          {userId ? (
            <button onClick={loadProfile} className="btn-primary mt-5 text-sm">
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const technicalSkills = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : []
  const softSkills = Array.isArray(profile.softSkills) ? profile.softSkills : []
  const suggestions = Array.isArray(profile.suggestions) ? profile.suggestions : []
  const documents = Array.isArray(profile.documents) ? profile.documents : []
  const visibleDocuments = documents.filter((d) => !hiddenCvKeys.has(cvFingerprint(d)))

  const completeness = Math.max(0, Math.min(Number(profile.profileCompleteness) || 0, 100))
  const strength = getStrengthConfig(profile.profileStrengthLevel)

  const eligibilityText = profile.participationEligibility ? 'Eligible' : 'Not Eligible'
  const eligibilityClass = profile.participationEligibility
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : 'text-red-700 bg-red-50 border-red-200'

  const ruralSupportText = profile.ruralSupportPriority ? 'Yes' : 'No'

  const roadmap = buildRoadmap(profile)
  const completedCount = roadmap.steps.filter((step) => step.completed).length

  const lastUpdatedLabel = profile.updatedAt ? formatDate(profile.updatedAt) : '—'

  return (
    <div className={pageShellClass}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Overview, readiness status, and profile growth insights.</p>
          <p className="text-xs text-slate-400 mt-1">Last updated: {lastUpdatedLabel}</p>
        </div>
        {!editMode ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditMode(true)} className="btn-secondary text-sm">
              Edit Profile
            </button>
            <button type="button" onClick={handleDeleteProfile} className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50">
              Delete Profile
            </button>
          </div>
        ) : null}
      </div>

      {editMode && editFormValues ? (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-lg text-navy-900 mb-4">Edit profile</h2>
          <YouthProfileForm
            initialValues={editFormValues}
            onSubmit={handleSaveProfile}
            submitLabel="Save changes"
            submitting={savingProfile}
            error={saveError}
            showCancel
            onCancel={() => {
              setEditMode(false)
              setSaveError('')
            }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section id="profile-overview" className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <UserCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Full Name</p>
              <h2 className="font-display font-bold text-xl text-navy-900">{profile.fullName || '—'}</h2>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-navy-900">Profile Completeness</p>
                <p className="text-sm font-semibold text-brand">{completeness}%</p>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-navy-700 transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Strength Level</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${strength.className}`}>
                  {strength.label}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">Eligibility</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${eligibilityClass}`}>
                  {eligibilityText}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Rural Support Priority</p>
                <p className="text-base font-semibold text-navy-900">{ruralSupportText}</p>
              </div>
            </div>
          </div>
        </section>

        {suggestions.length > 0 ? (
          <section className="card p-6">
            <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Lightbulb size={17} className="text-amber-500" />
              Suggestions
            </h3>
            <ul className="list-disc pl-5 space-y-2 marker:text-brand">
              {suggestions.map((item, idx) => (
                <li key={`${item}-${idx}`} className="text-sm text-slate-600 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="card p-6">
            <h3 className="font-display font-bold text-navy-900 mb-2 flex items-center gap-2">
              <Lightbulb size={17} className="text-amber-500" />
              Suggestions
            </h3>
            <p className="text-sm text-slate-500">No suggestions available at the moment.</p>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <section id="profile-skills-technical" className="card p-6">
          <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Wrench size={17} className="text-brand" />
            Technical Skills
          </h3>
          {technicalSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No technical skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {technicalSkills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20"
                >
                  {skill}
                  <button
                    type="button"
                    disabled={skillBusy}
                    aria-label={`Remove ${skill}`}
                    onClick={() => handleRemoveTechnicalSkill(idx)}
                    className="p-0.5 rounded-full hover:bg-brand/20 disabled:opacity-50"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input
              className="input flex-1"
              placeholder="Add a technical skill"
              value={techSkillInput}
              onChange={(e) => setTechSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTechnicalSkill())}
            />
            <button
              type="button"
              disabled={skillBusy}
              onClick={handleAddTechnicalSkill}
              className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </section>

        <section id="profile-skills-soft" className="card p-6">
          <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
            <HeartHandshake size={17} className="text-emerald-600" />
            Soft Skills
          </h3>
          {softSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No soft skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {softSkills.map((skill, idx) => (
                <span
                  key={`${skill}-${idx}`}
                  className="inline-flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {skill}
                  <button
                    type="button"
                    disabled={skillBusy}
                    aria-label={`Remove ${skill}`}
                    onClick={() => handleRemoveSoftSkill(idx)}
                    className="p-0.5 rounded-full hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input
              className="input flex-1"
              placeholder="Add a soft skill"
              value={softSkillInput}
              onChange={(e) => setSoftSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSoftSkill())}
            />
            <button
              type="button"
              disabled={skillBusy}
              onClick={handleAddSoftSkill}
              className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </section>
      </div>

      <section className="card p-6 mt-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display font-bold text-navy-900 flex items-center gap-2">
              <Sparkles size={16} className="text-brand" />
              Profile Roadmap
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
            {completedCount}/{roadmap.steps.length} Done
          </span>
        </div>

        {roadmap.nextStep ? (
          <div className="mb-4 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-brand font-semibold">Next Step</p>
            <p className="text-sm font-semibold text-navy-900 mt-0.5">{roadmap.nextStep.nextMessage}</p>
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-700">All roadmap milestones are completed.</p>
          </div>
        )}

        <div className="space-y-3">
          {roadmap.steps.map((step) => {
            const isNext = roadmap.nextStep?.key === step.key
            return (
              <div
                key={step.key}
                role="button"
                tabIndex={0}
                onClick={() => handleRoadmapStepNavigate(step.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRoadmapStepNavigate(step.key)
                  }
                }}
                className={`relative flex items-center justify-between rounded-xl border px-4 py-3 transition-colors cursor-pointer ${
                  isNext
                    ? 'border-brand/40 bg-gradient-to-r from-brand/10 to-white shadow-sm'
                    : step.completed
                      ? 'border-emerald-100 bg-emerald-50/40'
                      : 'border-slate-100 bg-slate-50/70'
                }`}
              >
                {isNext ? <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-brand" /> : null}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                      step.completed
                        ? 'border-emerald-200 bg-emerald-100/80 text-emerald-600'
                        : 'border-red-200 bg-red-50 text-red-500'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  <p className={`text-sm font-semibold ${isNext ? 'text-navy-900' : 'text-slate-700'}`}>{step.label}</p>
                </div>

                <span className={`text-xs font-semibold ${step.completed ? 'text-emerald-600' : 'text-red-500'}`}>
                  {step.completed ? '✔ Completed' : '❌ Not completed'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card p-6 mt-6">
        <h3 className="font-display font-bold text-navy-900 mb-4 flex items-center gap-2">
          <FileText size={17} className="text-navy-700" />
          CV / Documents
        </h3>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mb-5">
          <label className="block text-sm font-semibold text-navy-900 mb-2">Upload CV</label>
          {visibleDocuments.length > 0 ? (
            <p className="text-xs text-slate-600 mb-3">
              Current file:{' '}
              <span className="font-medium text-navy-900">
                {visibleDocuments[visibleDocuments.length - 1].fileName || 'CV'}
              </span>
            </p>
          ) : null}
          {documents.length > 0 && visibleDocuments.length === 0 ? (
            <p className="text-xs text-slate-500 mb-3">
              All uploaded files are hidden on this browser. You can upload a new CV below.
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload</>}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Accepted formats: PDF, DOC, DOCX</p>
          {selectedFile ? (
            <p className="text-xs text-slate-600 mt-1">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
          ) : null}
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : visibleDocuments.length === 0 ? null : (
          <div className="space-y-3">
            {visibleDocuments.map((doc) => (
              <div
                key={cvFingerprint(doc)}
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-navy-900">{doc.fileName || 'Untitled document'}</p>
                  <p className="text-xs text-slate-500">
                    Uploaded {formatDate(doc.uploadedAt)} • {formatFileSize(doc.sizeInBytes)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      View / Download <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No file URL available</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(doc)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Remove CV
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}