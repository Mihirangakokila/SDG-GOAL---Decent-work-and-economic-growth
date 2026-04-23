import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { internshipsAPI, applicationsAPI } from '../services/api'
import {
  MapPin, Clock, Eye, Briefcase, GraduationCap,
  ArrowLeft, CalendarDays, Share2, BookmarkPlus, BookmarkCheck, Loader2, X
} from 'lucide-react'
import { formatDate, skillColor, statusBadge } from '../utils/helpers'
import MessageButton from '../components/messaging/MessageButton'

const STORAGE_KEY = 'savedInternships'

const getSaved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

export default function InternshipDetailPage() {
  const { id } = useParams()
  const [internship, setInternship] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isSaved, setIsSaved] = useState(() => getSaved().includes(id))
  const [copyFeedback, setCopyFeedback] = useState(false)

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', cv: null })
  const [submittingApply, setSubmittingApply] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)
  const [applicationData, setApplicationData] = useState(null)
  const [showScore, setShowScore] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        await internshipsAPI.incrementView(id)
        const res = await internshipsAPI.getById(id)
        setInternship(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = () => {
    const saved = getSaved()
    let updated
    if (saved.includes(id)) {
      updated = saved.filter(s => s !== id)
      setIsSaved(false)
    } else {
      updated = [...saved, id]
      setIsSaved(true)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch {
      window.prompt('Copy this link:', window.location.href)
    }
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    setApplyError('')

    if (!applyForm.name.trim()) {
      return setApplyError('Full Name is required.')
    }
    if (!applyForm.email.toLowerCase().endsWith('@gmail.com')) {
      return setApplyError('Email must be a @gmail.com address.')
    }
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(applyForm.phone)) {
      return setApplyError('Phone number must be exactly 10 digits.')
    }

    setSubmittingApply(true)

    try {
      const formData = new FormData()
      formData.append('name', applyForm.name)
      formData.append('email', applyForm.email)
      formData.append('phoneNumber', applyForm.phone)
      if (applyForm.cv) {
        formData.append('cv', applyForm.cv)
      }

      const response = await applicationsAPI.apply(id, formData)
      setApplicationData(response.data.data)
      setApplySuccess(true)
      setShowScore(false)
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmittingApply(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )

  if (!internship) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <p className="font-display font-semibold text-navy-900 text-xl">Internship not found</p>
      <Link to="/internships" className="btn-primary">Browse other listings</Link>
    </div>
  )

  const {
    tittle, description, location, duration, status,
    requiredSkills = [], requiredEducation, viewCount,
    createdAt, organizationId, postedBy
  } = internship

  const orgName = organizationId?.organizationName ?? organizationId?.name ?? 'Organization'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Back */}
      <Link to="/internships" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand mb-8 transition-colors">
        <ArrowLeft size={15} /> Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header card */}
          <div className="card p-7 animate-fade-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-navy-100 flex items-center justify-center border border-slate-100 flex-shrink-0">
                <span className="text-xl font-bold text-brand font-display">
                  {orgName[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={statusBadge(status)}>{status}</span>
                </div>
                <h1 className="font-display font-bold text-2xl text-navy-900 leading-tight">{tittle}</h1>
                <p className="text-slate-500 mt-1">{orgName}</p>
              </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-3">
              {location && (
                <Chip icon={<MapPin size={13} />} label={location} />
              )}
              {duration && (
                <Chip icon={<Clock size={13} />} label={duration} />
              )}
              {requiredEducation && (
                <Chip icon={<GraduationCap size={13} />} label={requiredEducation} />
              )}
              <Chip icon={<CalendarDays size={13} />} label={`Posted ${formatDate(createdAt)}`} />
              <Chip icon={<Eye size={13} />} label={`${viewCount ?? 0} views`} />
            </div>
          </div>

          {/* Description */}
          <div className="card p-7 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="font-display font-bold text-navy-900 text-lg mb-4">About this Internship</h2>
            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {/* Skills */}
          {requiredSkills.length > 0 && (
            <div className="card p-7 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display font-bold text-navy-900 text-lg mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, i) => (
                  <span key={skill}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${skillColor(i)}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Apply CTA */}
          <div className="card p-6 animate-fade-up sticky top-24">
            <h3 className="font-display font-semibold text-navy-900 mb-1">Interested in this role?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Apply before this listing closes. Reach out to the organization directly.
            </p>

            {status === 'Active' ? (
              <button
                onClick={() => setShowApplyModal(true)}
                className="btn-primary w-full justify-center text-base py-3"
              >
                Apply Now
              </button>
            ) : (
              <div className="w-full py-3 text-center rounded-xl bg-slate-100 text-slate-400 text-sm font-medium">
                Applications Closed
              </div>
            )}

            {/* Message Button */}
            {postedBy && (
              <div className="mt-3">
                <MessageButton
                  targetUserId={postedBy}
                  targetUserName={orgName}
                  internshipId={internship._id}
                  internshipTitle={tittle}
                />
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                className={`btn-secondary flex-1 justify-center text-sm gap-1.5 transition-colors ${
                  isSaved ? 'text-brand border-brand/40 bg-brand/5' : ''
                }`}
              >
                {isSaved
                  ? <><BookmarkCheck size={14} className="fill-brand stroke-brand" /> Saved</>
                  : <><BookmarkPlus size={14} /> Save</>
                }
              </button>
              <button
                onClick={handleShare}
                className="btn-secondary flex-1 justify-center text-sm gap-1.5"
              >
                <Share2 size={14} />
                {copyFeedback ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card p-6 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display font-semibold text-navy-900">Quick Info</h3>
            {[
              { label: 'Duration', value: duration },
              { label: 'Location', value: location },
              { label: 'Education', value: requiredEducation },
              { label: 'Status', value: status },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                <span className="text-sm text-slate-700 text-right font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* Browse more */}
          <Link to="/internships" className="card p-5 flex items-center gap-3 group hover:-translate-y-0.5 transition-transform animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Briefcase size={16} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-navy-900 text-sm">Browse more internships</p>
              <p className="text-xs text-slate-400 mt-0.5">Find your perfect match</p>
            </div>
            <ArrowLeft size={15} className="text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 animate-fade-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-navy-900">Apply for Internship</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            {applySuccess ? (
              <div className="text-center py-8 animate-fade-up">
                {!showScore ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-display font-bold text-xl text-navy-900 mb-2">Application Submitted!</h3>
                    <p className="text-slate-500 mb-6">Your application has been successfully sent to the organization.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1 justify-center">
                        Close
                      </button>
                      <button onClick={() => setShowScore(true)} className="btn-primary flex-1 justify-center bg-indigo-600 hover:bg-indigo-700 text-white">
                        View Matching Score
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="animate-fade-up text-left">
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className={`${applicationData?.eligibilityScore >= 70 ? 'text-green-500' : applicationData?.eligibilityScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}
                            strokeDasharray={`${applicationData?.eligibilityScore || 0}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-display font-bold text-navy-900">{applicationData?.eligibilityScore || 0}%</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Match</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-xl text-navy-900 mb-4 text-center">Eligibility Breakdown</h3>

                    {applicationData?.scoreBreakdown && (
                      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {Object.entries(applicationData.scoreBreakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 capitalize">{key}</span>
                            <span className="text-sm font-bold text-navy-900">{value}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {applicationData?.aiReasoning && (
                      <div className="mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-2">AI Reasoning</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{applicationData.aiReasoning}</p>
                      </div>
                    )}

                    <button onClick={() => setShowApplyModal(false)} className="btn-primary justify-center w-full">
                      Close
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {applyError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input w-full"
                    placeholder="John Doe"
                    value={applyForm.name}
                    onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="form-input w-full"
                    placeholder="john@gmail.com"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input w-full"
                    placeholder="0712345678"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload CV *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-brand/10 file:text-brand
                      hover:file:bg-brand/20 transition-colors cursor-pointer"
                    onChange={(e) => setApplyForm({ ...applyForm, cv: e.target.files[0] })}
                  />
                  <p className="mt-1 text-xs text-slate-400">PDF, DOC, or DOCX (Max 5MB)</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1 justify-center">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingApply} className="btn-primary flex-1 justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                    {submittingApply ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Submitting...</>
                    ) : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

const Chip = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-sm text-slate-600 border border-slate-100">
    <span className="text-slate-400">{icon}</span>
    {label}
  </span>
)
