import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../services/api'
import {
  Loader2, Briefcase, ExternalLink, Clock,
  Trash2, Edit, X, MessageSquare, CheckCircle2,
  FileText, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/helpers'
import { useSocketCtx } from '../context/SocketContext'
import MessageButton from '../components/messaging/MessageButton'

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Applied: {
    label: 'Applied',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    icon: FileText,
    step: 0,
  },
  'Under Review': {
    label: 'Under Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    icon: Clock,
    step: 1,
  },
  Accepted: {
    label: 'Accepted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    icon: CheckCircle2,
    step: 2,
  },
  Rejected: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badgeBg: 'bg-red-100',
    icon: AlertCircle,
    step: -1,
  },
}

const STEPS = ['Applied', 'Under Review', 'Accepted']

// ── ApplicationTracker (inline, live) ──────────────────────────────────────────

function ApplicationTracker({ application, onStatusChange }) {
  const { socket } = useSocketCtx()
  const [status, setStatus] = useState(application?.status || 'Applied')
  const [flash, setFlash] = useState(false)

  // Listen for real-time status changes from the server
  useEffect(() => {
    if (!socket || !application?._id) return

    const handler = (data) => {
      if (String(data.applicationId) !== String(application._id)) return
      setStatus(data.status)
      setFlash(true)
      setTimeout(() => setFlash(false), 3000)
      // Bubble up so parent can refresh if needed
      if (onStatusChange) onStatusChange(application._id, data.status)
    }

    socket.on('application:statusChanged', handler)
    return () => socket.off('application:statusChanged', handler)
  }, [socket, application?._id, onStatusChange])

  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Applied']
  const Icon = config.icon
  const isRejected = status === 'Rejected'
  const currentStep = STEPS.indexOf(status)

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-500
        ${config.bg} ${config.border}
        ${flash ? 'ring-2 ring-offset-1 ring-emerald-400 scale-[1.02]' : ''}`}
    >
      {/* Status label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${config.text}`} />
          <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
        </div>
        {flash && (
          <span className="text-[10px] text-emerald-600 font-semibold animate-pulse">
            ⚡ Just updated
          </span>
        )}
      </div>

      {/* Progress steps */}
      {!isRejected && (
        <div>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= currentStep
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                      ${done ? 'bg-emerald-500' : 'bg-white border-2 border-gray-300'}`}
                  >
                    {done && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l2.5 2.5L8 3" />
                      </svg>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-0.5 transition-all duration-500 ${i < currentStep ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((step) => (
              <span
                key={step}
                className={`text-[9px] font-medium transition-colors ${step === status ? config.text : 'text-gray-400'}`}
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {isRejected && (
        <p className="text-[11px] text-red-500 leading-snug mt-1">
          Not selected this time. Keep applying!
        </p>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [editingApp, setEditingApp]     = useState(null)
  const [viewingApp, setViewingApp]     = useState(null)
  const [expandedId, setExpandedId]     = useState(null)
  const [editForm, setEditForm]         = useState({ name: '', email: '', phoneNumber: '', cv: null })
  const [updating, setUpdating]         = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const res = await applicationsAPI.getMine()
      setApplications(res.data.data)
    } catch (error) {
      console.error('Failed to load applications', error)
    } finally {
      setLoading(false)
    }
  }

  // Called by ApplicationTracker when a live status comes in
  const handleLiveStatusChange = (applicationId, newStatus) => {
    setApplications(prev =>
      prev.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      )
    )
    // If the details modal is open for this app, update it too
    setViewingApp(prev =>
      prev && prev._id === applicationId ? { ...prev, status: newStatus } : prev
    )
  }

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return
    try {
      await applicationsAPI.withdraw(id)
      setApplications(prev => prev.filter(app => app._id !== id))
      toast.success('Application withdrawn successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application')
    }
  }

  const openEditModal = (app) => {
    setEditingApp(app)
    setEditForm({ name: app.name || '', email: app.email || '', phoneNumber: app.phoneNumber || '', cv: null })
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) return toast.error('Full Name is required.')
    if (!editForm.email.toLowerCase().endsWith('@gmail.com'))
      return toast.error('Email must be a @gmail.com address.')
    if (!/^\d{10}$/.test(editForm.phoneNumber))
      return toast.error('Phone number must be exactly 10 digits.')

    setUpdating(true)
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('email', editForm.email)
      formData.append('phoneNumber', editForm.phoneNumber)
      if (editForm.cv) formData.append('cv', editForm.cv)

      await applicationsAPI.update(editingApp._id, formData)
      await fetchApplications()
      toast.success('Application updated successfully')
      setEditingApp(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application')
    } finally {
      setUpdating(false)
    }
  }

  // ── Score breakdown toggle ───────────────────────────────────────────────────
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    )
  }

  // ── Stats bar ────────────────────────────────────────────────────────────────
  const counts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-900 leading-tight">
          My Applications
        </h1>
        <p className="text-slate-500 mt-2">
          Track your internship applications in real-time. Status updates appear instantly.
        </p>
      </div>

      {/* Stats row */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            const count = counts[key] || 0
            return (
              <div key={key} className={`rounded-xl border p-3 flex items-center gap-3 ${cfg.bg} ${cfg.border}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.badgeBg}`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-navy-900 leading-none">{count}</p>
                  <p className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center animate-fade-up">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-brand w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-navy-900 mb-2">No applications yet</h2>
          <p className="text-slate-500 mb-6 max-w-md">
            You haven't applied to any internships yet. Start browsing to find your next opportunity!
          </p>
          <Link to="/internships" className="btn-primary">Browse Internships</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => {
            const orgId = app.internshipId?.organizationId?._id || app.internshipId?.organizationId
            const orgName = app.internshipId?.organizationId?.organizationName
              || app.internshipId?.organizationId?.name
              || 'Unknown Organization'
            const isExpanded = expandedId === app._id

            return (
              <div
                key={app._id}
                className="card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div>
                  {/* Title + org */}
                  <div className="mb-4">
                    <h3
                      className="font-display font-semibold text-lg text-navy-900 truncate"
                      title={app.internshipId?.tittle}
                    >
                      {app.internshipId?.tittle || 'Unknown Internship'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{orgName}</p>
                  </div>

                  {/* Live status tracker */}
                  <ApplicationTracker
                    application={app}
                    onStatusChange={handleLiveStatusChange}
                  />

                  {/* Applied date + score */}
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      <span>Applied {formatDate(app.appliedDate)}</span>
                    </div>

                    {/* Score row with expandable breakdown */}
                    <div>
                      <button
                        onClick={() => toggleExpand(app._id)}
                        className="w-full flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Match Score
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-display font-bold text-brand">
                            {app.eligibilityScore || 0}%
                          </span>
                          {isExpanded
                            ? <ChevronUp size={14} className="text-slate-400" />
                            : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </button>

                      {/* Breakdown */}
                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-lg border border-slate-100 bg-white space-y-1.5 animate-fade-up">
                          {app.scoreBreakdown && Object.entries(app.scoreBreakdown).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-brand"
                                    style={{ width: `${Math.min(val, 100)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-navy-900 w-8 text-right">{val}%</span>
                              </div>
                            </div>
                          ))}
                          {app.aiReasoning && (
                            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 leading-relaxed">
                              {app.aiReasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/internships/${app.internshipId?._id}`}
                      className="text-sm font-medium text-brand hover:text-navy-900 flex items-center gap-1.5 transition-colors"
                    >
                      View Listing <ExternalLink size={14} />
                    </Link>
                    <button
                      onClick={() => setViewingApp(app)}
                      className="text-sm font-medium text-slate-600 hover:text-brand transition-colors border border-slate-200 hover:border-brand/30 px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      Details
                    </button>
                  </div>

                  {/* Message HR button */}
                  {orgId && (
                    <MessageButton
                      targetUserId={String(orgId)}
                      targetUserName={orgName}
                      applicationId={app._id}
                      internshipId={app.internshipId?._id}
                      internshipTitle={app.internshipId?.tittle}
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── View Details Modal ─────────────────────────────────────────────── */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 animate-fade-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-navy-900">Application Details</h2>
              <button onClick={() => setViewingApp(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 text-left">
              {/* Live tracker inside modal too */}
              <ApplicationTracker
                application={viewingApp}
                onStatusChange={handleLiveStatusChange}
              />

              {/* User info */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Name',  value: viewingApp.name },
                  { label: 'Email', value: viewingApp.email },
                  { label: 'Phone', value: viewingApp.phoneNumber },
                  { label: 'Applied', value: formatDate(viewingApp.appliedDate) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
                    <p className="font-medium text-navy-900 text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {/* Score */}
              <div>
                <h3 className="font-display font-bold text-lg text-navy-900 mb-3 border-b border-slate-100 pb-2">
                  Matching Analysis
                </h3>

                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <span className="font-medium text-slate-700">Overall Match Score</span>
                  <span className="text-2xl font-display font-bold text-brand">
                    {viewingApp.eligibilityScore || 0}%
                  </span>
                </div>

                {viewingApp.scoreBreakdown && (
                  <div className="space-y-2 mb-4 p-4 border border-slate-100 rounded-xl">
                    {Object.entries(viewingApp.scoreBreakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.min(value, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-navy-900 w-8 text-right">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewingApp.aiReasoning && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-2">
                      AI Reasoning
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{viewingApp.aiReasoning}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-wrap md:flex-nowrap justify-between items-center border-t border-slate-100 gap-4">
                {viewingApp.cvUrl ? (
                  <a
                    href={viewingApp.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:text-indigo-700 text-sm font-medium underline flex-shrink-0"
                  >
                    View Uploaded CV
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">No CV Uploaded</span>
                )}

                {viewingApp.status === 'Applied' && (
                  <div className="flex flex-1 justify-end gap-2 shrink-0">
                    <button
                      onClick={() => { setViewingApp(null); openEditModal(viewingApp) }}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setViewingApp(null); handleWithdraw(viewingApp._id) }}
                      className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} /> Withdraw
                    </button>
                  </div>
                )}
              </div>

              {/* Message HR from modal */}
              {(() => {
                const orgId = viewingApp.internshipId?.organizationId?._id
                  || viewingApp.internshipId?.organizationId
                const orgName = viewingApp.internshipId?.organizationId?.organizationName
                  || viewingApp.internshipId?.organizationId?.name
                  || 'HR'
                return orgId ? (
                  <MessageButton
                    targetUserId={String(orgId)}
                    targetUserName={orgName}
                    applicationId={viewingApp._id}
                    internshipId={viewingApp.internshipId?._id}
                    internshipTitle={viewingApp.internshipId?.tittle}
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                  />
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 animate-fade-up shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-navy-900">Edit Application</h2>
              <button onClick={() => setEditingApp(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input w-full"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="form-input w-full"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  className="form-input w-full"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload New CV <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-brand/10 file:text-brand
                    hover:file:bg-brand/20 transition-colors cursor-pointer"
                  onChange={(e) => setEditForm({ ...editForm, cv: e.target.files[0] })}
                />
                <p className="mt-1 text-xs text-slate-400">PDF, DOC, or DOCX (Max 5MB). Leave blank to keep current CV.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1 justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating
                    ? <><Loader2 size={16} className="animate-spin mr-2" /> Updating...</>
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
