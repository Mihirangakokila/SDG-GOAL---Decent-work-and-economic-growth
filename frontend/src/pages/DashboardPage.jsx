import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/dashboard/StatCard'
import {
  Briefcase, PlusCircle, Eye, Users, TrendingUp, BarChart2,
  CheckCircle2, XCircle, Edit3, Trash2,
  Loader2, MoreVertical, ChevronDown, Search
} from 'lucide-react'
import { timeAgo, statusBadge, truncate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats,        setStats]        = useState(null)
  const [internships,  setInternships]  = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [deleting,     setDeleting]     = useState(null)
  const [openMenu,     setOpenMenu]     = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, listRes] = await Promise.all([
        internshipsAPI.dashboard(),
        internshipsAPI.getMine(statusFilter ? { status: statusFilter } : {}),
      ])
      setStats(statsRes.data.data ?? statsRes.data)
      setInternships(listRes.data.internships ?? listRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this internship? This cannot be undone.')) return
    setDeleting(id)
    try {
      await internshipsAPI.delete(id)
      toast.success('Internship deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const orgName = user?.name ?? 'Organization'

  const filtered = internships.filter(i =>
    !search || i.tittle?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, <span className="font-medium text-navy-800">{orgName}</span></p>
        </div>
        <Link to="/dashboard/post" className="btn-primary flex-shrink-0">
          <PlusCircle size={16} /> Post Internship
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <StatCard label="Total"       value={stats.totalInternships}  icon={Briefcase}     color="navy"   />
          <StatCard label="Active"      value={stats.activeInternships} icon={CheckCircle2}  color="green"  />
          <StatCard label="Closed"      value={stats.closedInternships} icon={XCircle}       color="amber"  />
          <StatCard label="Total Views" value={stats.totalViews}        icon={Eye}           color="blue"   />
          <StatCard label="Applicants"  value={stats.totalApplicants}   icon={Users}         color="purple" />
          <StatCard label="Accept Rate" value={`${stats.acceptanceRate}%`} icon={TrendingUp}  color="green"  />
        </div>
      )}

      {/* Internships Table */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <h2 className="font-display font-bold text-navy-900">My Internships</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-8 py-2 text-sm"
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Briefcase size={22} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-navy-900">No internships yet</p>
              <p className="text-sm text-slate-400 mt-1">Post your first internship to get started.</p>
            </div>
            <Link to="/dashboard/post" className="btn-primary text-sm">
              <PlusCircle size={15} /> Post Internship
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Title', 'Status', 'Location', 'Views', 'Posted', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-900 group-hover:text-brand transition-colors line-clamp-1 max-w-[220px]">
                        {item.tittle}
                      </p>
                      {item.duration && (
                        <p className="text-xs text-slate-400 mt-0.5">{item.duration}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadge(item.status)}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[140px] truncate">
                      {item.location ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {item.viewCount ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/dashboard/analytics/${item._id}`}
                          className="p-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-600 text-slate-400 transition-colors"
                          title="Analytics">
                          <BarChart2 size={14} />
                        </Link>
                        <Link to={`/dashboard/edit/${item._id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-brand text-slate-400 transition-colors"
                          title="Edit">
                          <Edit3 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deleting === item._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors disabled:opacity-50"
                          title="Delete">
                          {deleting === item._id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
