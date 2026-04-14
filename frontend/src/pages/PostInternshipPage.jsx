import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  PlusCircle, X, Loader2, ChevronLeft, Save,
  Briefcase, MapPin, Clock, GraduationCap, Tag, FileText, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  tittle: '', description: '', location: '', duration: '',
  requiredEducation: '', status: 'Draft', requiredSkills: [],
}

const EDUCATION_OPTIONS = ["Bachelor's", "Master's", "PhD", "Diploma", "High School", "Any"]
const STATUS_OPTIONS     = ['Draft', 'Active', 'Closed']
const DURATION_OPTIONS   = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year', 'Flexible']

export default function PostInternshipPage() {
  const { id }       = useParams()         // present when editing
  const isEdit       = !!id
  const navigate     = useNavigate()
  const { user }     = useAuth()

  const [form,       setForm]       = useState(EMPTY_FORM)
  const [skillInput, setSkillInput] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [fetching,   setFetching]   = useState(isEdit)
  const [errors,     setErrors]     = useState({})

  // Load existing internship when editing
  useEffect(() => {
    if (!isEdit) return
    internshipsAPI.getById(id)
      .then(res => {
        const d = res.data
        setForm({
          tittle:            d.tittle            ?? '',
          description:       d.description       ?? '',
          location:          d.location          ?? '',
          duration:          d.duration          ?? '',
          requiredEducation: d.requiredEducation ?? '',
          status:            d.status            ?? 'Draft',
          requiredSkills:    d.requiredSkills    ?? [],
        })
      })
      .catch(() => toast.error('Could not load internship'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (!form.requiredSkills.includes(s)) {
      set('requiredSkills', [...form.requiredSkills, s])
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    set('requiredSkills', form.requiredSkills.filter(s => s !== skill))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() }
  }

  const validate = () => {
    const e = {}
    if (!form.tittle.trim())       e.tittle       = 'Title is required'
    if (!form.description.trim())  e.description  = 'Description is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      if (isEdit) {
        await internshipsAPI.update(id, form)
        toast.success('Internship updated!')
      } else {
        await internshipsAPI.create(form)
        toast.success('Internship posted!')
      }
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message ?? ''
      if (
        msg.toLowerCase().includes('geo') ||
        msg.toLowerCase().includes('coordinates') ||
        msg.toLowerCase().includes('location') ||
        msg.toLowerCase().includes('point')
      ) {
        setErrors(e => ({
          ...e,
          location: 'Enter a valid city or place name (e.g. "Colombo, Sri Lanka" or "Remote")',
        }))
        toast.error('Invalid location — please enter a recognisable place name.')
      } else {
        toast.error(msg || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <button onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand mb-8 transition-colors">
        <ChevronLeft size={15} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">
          {isEdit ? 'Edit Internship' : 'Post a New Internship'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isEdit ? 'Update the details below.' : 'Fill in the details to attract the right candidates.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title + Status */}
        <div className="card p-7 space-y-5 animate-fade-up">
          <SectionHeader icon={<Briefcase size={16} />} title="Basic Information" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="label">Job Title <Required /></label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer Intern"
                value={form.tittle}
                onChange={e => set('tittle', e.target.value)}
                className={`input ${errors.tittle ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.tittle && <p className="text-xs text-red-500 mt-1">{errors.tittle}</p>}
            </div>

            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {form.status === 'Draft' ? 'Only visible to you' :
                 form.status === 'Active' ? 'Visible to all students' : 'Listing closed'}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-7 space-y-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <SectionHeader icon={<FileText size={16} />} title="Description" />

          <div>
            <label className="label">Job Description <Required /></label>
            <textarea
              rows={7}
              placeholder="Describe the role, responsibilities, what the intern will learn, team culture, etc."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={`input resize-none leading-relaxed ${errors.description ? 'border-red-300 ring-2 ring-red-100' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            <p className="text-xs text-slate-400 mt-1">{form.description.length} characters</p>
          </div>
        </div>

        {/* Location + Duration + Education */}
        <div className="card p-7 space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <SectionHeader icon={<MapPin size={16} />} title="Details" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                placeholder="City, Country or Remote"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                className={`input ${errors.location ? 'border-red-300 ring-2 ring-red-100' : ''}`}
              />
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="label">Duration</label>
              <select value={form.duration} onChange={e => set('duration', e.target.value)} className="input">
                <option value="">Select duration</option>
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Required Education</label>
              <select value={form.requiredEducation} onChange={e => set('requiredEducation', e.target.value)} className="input">
                <option value="">Any level</option>
                {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-7 space-y-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <SectionHeader icon={<Tag size={16} />} title="Required Skills" />

          <div>
            <label className="label">Add Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a skill and press Enter…"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="input"
              />
              <button type="button" onClick={addSkill}
                className="btn-secondary flex-shrink-0 px-4">
                <PlusCircle size={15} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Press Enter or comma to add a skill</p>
          </div>

          {form.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.requiredSkills.map((skill) => (
                <span key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}
                    className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preview & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-slate-400">
            {form.status === 'Draft'
              ? '💾 Saving as draft — not visible to students yet.'
              : '🚀 Will be published immediately upon save.'}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary min-w-[140px] justify-center">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Post Internship'}</>
              }
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}

const Required = () => <span className="text-red-400">*</span>

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
    <span className="text-brand">{icon}</span>
    <h2 className="font-display font-semibold text-navy-900">{title}</h2>
  </div>
)
