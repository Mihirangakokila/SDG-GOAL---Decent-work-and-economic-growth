import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../services/api'
import { Loader2, Briefcase, ExternalLink, Clock, Trash2, Edit, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/helpers'

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const [editingApp, setEditingApp] = useState(null)
  const [viewingApp, setViewingApp] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phoneNumber: '', cv: null })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
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
    fetchApplications()
  }, [])

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
    
    // Validations
    if (!editForm.name.trim()) {
      return toast.error('Full Name is required.')
    }
    if (!editForm.email.toLowerCase().endsWith('@gmail.com')) {
      return toast.error('Email must be a @gmail.com address.')
    }
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(editForm.phoneNumber)) {
      return toast.error('Phone number must be exactly 10 digits.')
    }

    setUpdating(true)
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('email', editForm.email)
      formData.append('phoneNumber', editForm.phoneNumber)
      if (editForm.cv) {
        formData.append('cv', editForm.cv)
      }
      
      const res = await applicationsAPI.update(editingApp._id, formData)
      
      const updatedApplicationsResponse = await applicationsAPI.getMine()
      setApplications(updatedApplicationsResponse.data.data)
      
      toast.success('Application updated successfully')
      setEditingApp(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    )
  }

  const statusColor = (status) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'Reviewed': return 'bg-yellow-50 text-yellow-600 border-yellow-100'
      case 'Accepted': return 'bg-green-50 text-green-600 border-green-100'
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-900 leading-tight">My Applications</h1>
        <p className="text-slate-500 mt-2">Track the status of the internships you have applied for.</p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center animate-fade-up">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-brand w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-navy-900 mb-2">No applications yet</h2>
          <p className="text-slate-500 mb-6 max-w-md">You haven't applied to any internships yet. Start browsing to find your next opportunity!</p>
          <Link to="/internships" className="btn-primary">Browse Internships</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <div key={app._id} className="card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-display font-semibold text-lg text-navy-900 truncate" title={app.internshipId?.tittle}>
                      {app.internshipId?.tittle || 'Unknown Internship'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 truncate">
                      {app.internshipId?.organizationId?.organizationName || app.internshipId?.organizationId?.name || 'Unknown Organization'}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(app.status)}`}>
                    {app.status}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>Applied {formatDate(app.appliedDate)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 rounded-lg p-3 mt-2 border border-slate-100">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Match Score</span>
                    <span className="font-display font-bold text-brand">{app.eligibilityScore || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                 <Link to={`/internships/${app.internshipId?._id}`} className="text-sm font-medium text-brand hover:text-navy-900 flex items-center gap-1.5 transition-colors">
                  View Listing <ExternalLink size={14} />
                 </Link>
                 
                 <button onClick={() => setViewingApp(app)} className="text-sm font-medium text-slate-600 hover:text-brand transition-colors border border-slate-200 hover:border-brand/30 px-3 py-1.5 rounded-lg active:scale-95">
                   View Details
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
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
               {/* User Info */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Name</p>
                   <p className="font-medium text-navy-900">{viewingApp.name}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Email</p>
                   <p className="font-medium text-navy-900">{viewingApp.email}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Phone</p>
                   <p className="font-medium text-navy-900">{viewingApp.phoneNumber}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Status</p>
                   <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex border mt-1 ${statusColor(viewingApp.status)}`}>
                     {viewingApp.status}
                   </span>
                 </div>
               </div>

               {/* Score */}
               <div>
                  <h3 className="font-display font-bold text-lg text-navy-900 mb-3 border-b border-slate-100 pb-2">Matching Analysis</h3>
                  
                  <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                    <span className="font-medium text-slate-700">Overall Match Score</span>
                    <span className="text-2xl font-display font-bold text-brand">{viewingApp.eligibilityScore || 0}%</span>
                  </div>

                  {viewingApp.scoreBreakdown && (
                    <div className="space-y-2 mb-4 p-4 border border-slate-100 rounded-xl">
                      {Object.entries(viewingApp.scoreBreakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 capitalize">{key}</span>
                          <span className="font-bold text-navy-900">{value}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewingApp.aiReasoning && (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-2">AI Reasoning</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{viewingApp.aiReasoning}</p>
                    </div>
                  )}
               </div>

               {/* Actions */}
               <div className="pt-4 flex flex-wrap md:flex-nowrap justify-between items-center border-t border-slate-100 gap-4">
                  {viewingApp.cvUrl ? (
                    <a href={viewingApp.cvUrl} target="_blank" rel="noreferrer" className="text-brand hover:text-indigo-700 text-sm font-medium underline flex-shrink-0">
                      View Uploaded CV
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">No CV Uploaded</span>
                  )}
                  
                  {viewingApp.status === 'Applied' && (
                    <div className="flex flex-1 justify-end gap-2 shrink-0">
                       <button onClick={() => { setViewingApp(null); openEditModal(viewingApp); }} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                         <Edit size={14} /> Edit
                       </button>
                       <button onClick={() => { setViewingApp(null); handleWithdraw(viewingApp._id); }} className="px-4 py-2 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors">
                         <Trash2 size={14} /> Withdraw
                       </button>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload New CV (Optional)</label>
                <input
                  type="file"
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
                <button type="button" onClick={() => setEditingApp(null)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn-primary flex-1 justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {updating ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Updating...</>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
