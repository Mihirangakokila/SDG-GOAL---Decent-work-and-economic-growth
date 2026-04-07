import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import InternshipCard from '../components/internship/InternshipCard'
import SearchBar from '../components/internship/SearchBar'
import Pagination from '../components/common/Pagination'
import { Briefcase, Loader2, SearchX } from 'lucide-react'

const DEFAULT_PARAMS = {
  keyword:   '',
  location:  '',
  skills:    '',       // sent as clean comma-joined string, e.g. "React,Python"
  education: '',
  status:    'Active', // default to Active on first load only
  page:      1,
  limit:     10,       // matches backend default to keep page counts consistent
  sortBy:    'createdAt',
  order:     'desc',
}

const SORT_OPTIONS = [
  { label: 'Newest',      value: 'createdAt:desc' },
  { label: 'Oldest',      value: 'createdAt:asc'  },
  { label: 'Most Viewed', value: 'viewCount:desc'  },
]

export default function InternshipsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [params, setParams] = useState(() => ({
    ...DEFAULT_PARAMS,
    // Restore from URL on load (e.g. when coming from homepage search)
    keyword:  searchParams.get('keyword')  ?? '',
    location: searchParams.get('location') ?? '',
    skills:   searchParams.get('skills')   ?? '',
    status:   searchParams.get('status')   ?? 'Active',
  }))
  const [data,    setData]    = useState({ internships: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Build query — only include non-empty values so backend doesn't filter on blank strings
      const query = {}
      if (params.keyword)   query.keyword   = params.keyword.trim()
      if (params.location)  query.location  = params.location.trim()
      // Skills: backend splits on comma — must be trimmed, no spaces around commas
      if (params.skills)    query.skills    = params.skills   // already clean from SearchBar
      if (params.education) query.education = params.education
      if (params.status)    query.status    = params.status   // omit if '' = show all
      query.page   = params.page
      query.limit  = params.limit
      query.sortBy = params.sortBy
      query.order  = params.order

      const res = await internshipsAPI.search(query)
      // Backend wraps in { success, data: { internships, total, totalPages, page } }
      const result = res.data.data ?? res.data
      setData({
        internships: result.internships ?? [],
        total:       result.total       ?? 0,
        totalPages:  result.totalPages  ?? 1,
      })
    } catch (err) {
      console.error('Search error:', err)
      setData({ internships: [], total: 0, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchData() }, [fetchData])

  // Keep URL in sync so searches are shareable / bookmarkable
  useEffect(() => {
    const p = {}
    if (params.keyword)   p.keyword   = params.keyword
    if (params.location)  p.location  = params.location
    if (params.skills)    p.skills    = params.skills
    if (params.status && params.status !== 'Active') p.status = params.status
    setSearchParams(p, { replace: true })
  }, [params.keyword, params.location, params.skills, params.status])

  const handlePageChange = (p) => {
    setParams(prev => ({ ...prev, page: p }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSort = (val) => {
    const [sortBy, order] = val.split(':')
    setParams(p => ({ ...p, sortBy, order, page: 1 }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-1">Browse Internships</h1>
        <p className="text-slate-500 text-sm">
          {loading
            ? 'Searching…'
            : `${data.total.toLocaleString()} opportunit${data.total !== 1 ? 'ies' : 'y'} found`
          }
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <SearchBar params={params} onChange={setParams} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {!loading && data.totalPages > 1 && `Page ${params.page} of ${data.totalPages}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort by:</span>
          <select
            value={`${params.sortBy}:${params.order}`}
            onChange={e => handleSort(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm">Searching internships…</p>
        </div>
      ) : data.internships.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.internships.map((internship, i) => (
              <div key={internship._id} style={{ animationDelay: `${i * 0.04}s` }}>
                <InternshipCard internship={internship} />
              </div>
            ))}
          </div>

          <Pagination
            page={params.page}
            totalPages={data.totalPages}
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
      <SearchX size={28} className="text-slate-400" />
    </div>
    <div>
      <p className="font-display font-semibold text-navy-900 text-lg">No internships found</p>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">
        Try different keywords, removing some filters, or check your spelling.
      </p>
    </div>
  </div>
)
3