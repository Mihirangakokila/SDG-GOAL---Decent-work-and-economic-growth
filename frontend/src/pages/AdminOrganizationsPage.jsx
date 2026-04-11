import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Loader2, ExternalLink, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

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

/** Sri Lanka: province → administrative districts (English names). */
const SL_PROVINCE_TO_DISTRICTS = {
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Southern: ['Galle', 'Matara', 'Hambantota'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
  Eastern: ['Batticaloa', 'Ampara', 'Trincomalee'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Uva: ['Badulla', 'Monaragala'],
  Sabaragamuwa: ['Ratnapura', 'Kegalle'],
}

const SL_PROVINCE_ORDER = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
]

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatActivityLine = (value) => {
  const d = formatDate(value)
  return d === '—' ? '—' : `Updated on ${d}`
}

const toDateStart = (value) => {
  if (!value) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const toDateEnd = (value) => {
  if (!value) return null
  const d = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(d.getTime()) ? null : d
}

const inDateRange = (createdAt, fromDate, toDate) => {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  if (fromDate && t < fromDate.getTime()) return false
  if (toDate && t > toDate.getTime()) return false
  return true
}

const youthUserId = (p) => p?.user?._id ?? p?.user ?? null

const skillsDisplay = (skills) => {
  if (Array.isArray(skills)) return skills.filter(Boolean).join(', ') || '—'
  return skills ? String(skills) : '—'
}

const NEW_BADGE_WINDOW_MS = 24 * 60 * 60 * 1000

const isNewWithinWindow = (createdAt) => {
  if (!createdAt) return false
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < NEW_BADGE_WINDOW_MS
}

const shouldShowNewOrgBadge = (org) => {
  const isVerified = org?.verified === true
  if (isVerified) return false
  return isNewWithinWindow(org?.createdAt)
}

function AdminYouthCharts({ profiles }) {
  const strengthData = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0 }
    for (const p of profiles) {
      const k = String(p.profileStrengthLevel || '').toLowerCase()
      if (k in c) c[k] += 1
      else c.low += 1
    }
    return [
      { name: 'Low', value: c.low },
      { name: 'Medium', value: c.medium },
      { name: 'High', value: c.high },
    ]
  }, [profiles])

  const eligData = useMemo(() => {
    let e = 0
    let ne = 0
    for (const p of profiles) {
      if (p.participationEligibility) e += 1
      else ne += 1
    }
    return [
      { name: 'Eligible', value: e },
      { name: 'Not eligible', value: ne },
    ]
  }, [profiles])

  const ruralData = useMemo(() => {
    let r = 0
    let nr = 0
    for (const p of profiles) {
      if (p.ruralAreaFlag) r += 1
      else nr += 1
    }
    return [
      { name: 'Rural', value: r },
      { name: 'Non-rural', value: nr },
    ]
  }, [profiles])

  const pieColors = ['#22c55e', '#94a3b8', '#0ea5e9', '#64748b']

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Profile strength</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strengthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Eligibility</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={eligData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={56}
                paddingAngle={2}
              >
                {eligData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Rural vs non-rural</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ruralData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={56}
                paddingAngle={2}
              >
                {ruralData.map((_, i) => (
                  <Cell key={i} fill={pieColors[(i + 2) % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function AdminOrganizationCharts({ organizations, loading }) {
  const verifiedData = useMemo(() => {
    let v = 0
    let nv = 0
    for (const o of organizations) {
      if (o.verified) v += 1
      else nv += 1
    }
    return [
      { name: 'Verified', value: v },
      { name: 'Not verified', value: nv },
    ]
  }, [organizations])

  const readinessData = useMemo(() => {
    let draft = 0
    let ready = 0
    for (const o of organizations) {
      const s = String(o.readinessStatus || '').toUpperCase()
      if (s === 'READY') ready += 1
      else draft += 1
    }
    return [
      { name: 'DRAFT', value: draft },
      { name: 'READY', value: ready },
    ]
  }, [organizations])

  const completenessData = useMemo(() => {
    const b = { '0–49%': 0, '50–79%': 0, '80–100%': 0 }
    for (const o of organizations) {
      const n = Number(o.profileCompletenessPercentage)
      const p = Number.isFinite(n) ? n : 0
      if (p >= 80) b['80–100%'] += 1
      else if (p >= 50) b['50–79%'] += 1
      else b['0–49%'] += 1
    }
    return [
      { name: '0–49%', value: b['0–49%'] },
      { name: '50–79%', value: b['50–79%'] },
      { name: '80–100%', value: b['80–100%'] },
    ]
  }, [organizations])

  const docsData = useMemo(() => {
    let withDocs = 0
    let noDocs = 0
    for (const o of organizations) {
      const hasDocs = Array.isArray(o.documents) && o.documents.length > 0
      if (hasDocs) withDocs += 1
      else noDocs += 1
    }
    return [
      { name: 'With documents', value: withDocs },
      { name: 'No documents', value: noDocs },
    ]
  }, [organizations])

  const industryBarData = useMemo(() => {
    const map = new Map()
    for (const o of organizations) {
      const ind = (o.industry || 'Unknown').trim() || 'Unknown'
      map.set(ind, (map.get(ind) || 0) + 1)
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name: name.length > 22 ? `${name.slice(0, 20)}…` : name, value, full: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [organizations])

  const pieColors = ['#22c55e', '#94a3b8', '#0ea5e9', '#64748b', '#a855f7', '#f59e0b']

  if (loading && organizations.length === 0) {
    return (
      <div className="card p-12 mb-6 flex items-center justify-center gap-3 text-slate-500 text-sm">
        <Loader2 size={22} className="animate-spin text-brand" />
        <span>Loading organization summaries…</span>
      </div>
    )
  }

  if (!organizations.length) {
    return (
      <div className="card p-6 mb-6 text-center text-sm text-slate-500">
        No organization profiles yet. Charts will appear when organizations register.
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Verification</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verifiedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={56}
                  paddingAngle={2}
                >
                  {verifiedData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Readiness</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Profile completeness</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completenessData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Documentation status</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={docsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={56}
                  paddingAngle={2}
                >
                  {docsData.map((_, i) => (
                    <Cell key={i} fill={pieColors[(i + 2) % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Top industries</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={industryBarData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fontSize: 10 }}
                interval={0}
              />
              <Tooltip formatter={(value, _n, item) => [value, item?.payload?.full ?? 'Industry']} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Organizations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrganizationsPage() {
  const [adminTab, setAdminTab] = useState('youth')
  const [allOrganizations, setAllOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [verifying, setVerifying] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [detailOrg, setDetailOrg] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [youthProfiles, setYouthProfiles] = useState([])
  const [youthLoading, setYouthLoading] = useState(true)
  const [youthPage, setYouthPage] = useState(1)
  const [youthLimit] = useState(10)
  const [youthDeleting, setYouthDeleting] = useState(null)
  const [detailYouth, setDetailYouth] = useState(null)
  const [detailYouthLoading, setDetailYouthLoading] = useState(false)
  const [youthSearch, setYouthSearch] = useState('')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [youthRuralFilter, setYouthRuralFilter] = useState('all')
  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')
  const [reportGenerating, setReportGenerating] = useState(false)

  const prevYouthCountRef = useRef(0)
  const youthPollSeededRef = useRef(false)

  const listQueryRef = useRef({ search, verifiedFilter, industryFilter, page, limit })
  listQueryRef.current = { search, verifiedFilter, industryFilter, page, limit }

  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    const { search: s, verifiedFilter: vf, industryFilter: ind, page: p, limit: l } = listQueryRef.current
    try {
      const params = { page: p, limit: l }
      if (s.trim()) params.search = s.trim()
      if (vf === 'true' || vf === 'false') {
        params.verified = vf === 'true'
      }
      if (ind) params.industry = ind

      const res = await api.get('/organizations', { params })
      const raw = res.data?.organizations ?? []
      setAllOrganizations(raw)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to load organizations')
      setAllOrganizations([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchYouthProfiles = useCallback(async (silent = false) => {
    if (!silent) setYouthLoading(true)
    try {
      const res = await api.get('/profiles')
      const raw = res.data?.profiles ?? []
      const sorted = [...raw].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const prevCount = prevYouthCountRef.current
      if (youthPollSeededRef.current && sorted.length > prevCount) {
        toast.success('New user profile created')
      }
      youthPollSeededRef.current = true
      prevYouthCountRef.current = sorted.length
      setYouthProfiles(sorted)
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message ?? 'Failed to load youth profiles')
      setYouthProfiles([])
    } finally {
      if (!silent) setYouthLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    fetchYouthProfiles(false)
    const id = setInterval(() => fetchYouthProfiles(true), 5000)
    return () => clearInterval(id)
  }, [fetchYouthProfiles])

  const filtered = useMemo(() => {
    let rows = allOrganizations
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((o) =>
        [o.organizationName, o.industry, o.location].some((f) =>
          String(f ?? '')
            .toLowerCase()
            .includes(q)
        )
      )
    }
    if (verifiedFilter === 'true') rows = rows.filter((o) => o.verified === true)
    if (verifiedFilter === 'false') rows = rows.filter((o) => o.verified === false)
    if (industryFilter) rows = rows.filter((o) => o.industry === industryFilter)
    return rows
  }, [allOrganizations, search, verifiedFilter, industryFilter])

  const industryOptions = useMemo(() => {
    const fromData = [...new Set(allOrganizations.map((o) => o.industry).filter(Boolean))]
    return [...new Set([...INDUSTRY_OPTIONS, ...fromData])].sort((a, b) => a.localeCompare(b))
  }, [allOrganizations])

  useEffect(() => {
    setPage(1)
  }, [search, verifiedFilter, industryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit) || 1)
  const paged = useMemo(() => {
    const start = (page - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, page, limit])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const slDistrictsForProvince = useMemo(() => {
    if (!province) return []
    return SL_PROVINCE_TO_DISTRICTS[province] ?? []
  }, [province])

  const filteredYouth = useMemo(() => {
    let rows = youthProfiles
    const q = youthSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter((p) =>
        [p.fullName, p.contactNumber, p.district, p.provinceOrState].some((f) =>
          String(f ?? '')
            .toLowerCase()
            .includes(q)
        )
      )
    }
    const norm = (s) => String(s ?? '').trim().toLowerCase()
    if (province) {
      const provNorm = norm(province)
      const allowedDistricts = (SL_PROVINCE_TO_DISTRICTS[province] ?? []).map((d) => norm(d))
      const profileProvinceMatches = (raw) => {
        const r = String(raw ?? '').trim().toLowerCase()
        if (!r) return false
        if (r === provNorm) return true
        if (r === `${provNorm} province`) return true
        if (r.replace(/\s+province$/i, '') === provNorm) return true
        return false
      }
      rows = rows.filter((p) => {
        if (profileProvinceMatches(p.provinceOrState)) return true
        if (!String(p.provinceOrState ?? '').trim() && allowedDistricts.includes(norm(p.district))) return true
        return false
      })
    }
    if (district) {
      const dNorm = norm(district)
      rows = rows.filter((p) => norm(p.district) === dNorm)
    }
    if (youthRuralFilter === 'rural') rows = rows.filter((p) => p.ruralAreaFlag === true)
    if (youthRuralFilter === 'non-rural') rows = rows.filter((p) => !p.ruralAreaFlag)
    return rows
  }, [youthProfiles, youthSearch, province, district, youthRuralFilter])

  useEffect(() => {
    setYouthPage(1)
  }, [youthSearch, province, district, youthRuralFilter])

  const youthTotalPages = Math.max(1, Math.ceil(filteredYouth.length / youthLimit) || 1)
  const youthPaged = useMemo(() => {
    const start = (youthPage - 1) * youthLimit
    return filteredYouth.slice(start, start + youthLimit)
  }, [filteredYouth, youthPage, youthLimit])

  useEffect(() => {
    if (youthPage > youthTotalPages) setYouthPage(youthTotalPages)
  }, [youthPage, youthTotalPages])

  const openOrgDetails = async (id) => {
    setDetailLoading(true)
    setDetailOrg(null)
    try {
      const res = await api.get(`/organizations/${id}`)
      setDetailOrg(res.data?.organization ?? null)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to load organization')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeOrgDetails = () => {
    setDetailOrg(null)
    setDetailLoading(false)
  }

  const openYouthDetails = async (userId) => {
    if (!userId) return
    setDetailYouthLoading(true)
    setDetailYouth(null)
    try {
      const res = await api.get(`/profile/${userId}`)
      setDetailYouth(res.data?.profile ?? null)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to load profile')
    } finally {
      setDetailYouthLoading(false)
    }
  }

  const closeYouthDetails = () => {
    setDetailYouth(null)
    setDetailYouthLoading(false)
  }

  const handleVerify = async (id) => {
    setVerifying(id)
    try {
      await api.put(`/organizations/${id}`, { verified: true })
      toast.success('Organization verified successfully')
      await loadOrganizations()
      if (detailOrg?._id === id) {
        const res = await api.get(`/organizations/${id}`)
        setDetailOrg(res.data?.organization ?? null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to verify organization')
    } finally {
      setVerifying(null)
    }
  }

  const handleDeleteOrg = async (id) => {
    if (!window.confirm('Delete this organization profile? This cannot be undone.')) return
    setDeleting(id)
    try {
      await api.delete(`/organizations/${id}`)
      toast.success('Organization deleted successfully')
      if (detailOrg?._id === id) closeOrgDetails()
      await loadOrganizations()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to delete organization')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteYouth = async (userId) => {
    if (!userId) return
    if (!window.confirm('Delete this youth profile? This cannot be undone.')) return
    setYouthDeleting(userId)
    try {
      await api.delete(`/profile/${userId}`)
      toast.success('Profile deleted')
      if (detailYouth && youthUserId(detailYouth) === userId) closeYouthDetails()
      await fetchYouthProfiles(true)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to delete profile')
    } finally {
      setYouthDeleting(null)
    }
  }

  const handleDownloadReport = () => {
    if (!reportFromDate || !reportToDate) {
      toast.error('Please select a date range')
      return
    }

    const fromDate = toDateStart(reportFromDate)
    const toDate = toDateEnd(reportToDate)
    if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
      toast.error('Please select a valid date range')
      return
    }

    setReportGenerating(true)
    try {
      const youthInRange = filteredYouth.filter((p) => inDateRange(p.createdAt, fromDate, toDate))
      const orgsInRange = filtered.filter((o) => inDateRange(o.createdAt, fromDate, toDate))
      const verifiedCount = orgsInRange.filter((o) => o.verified === true).length
      const unverifiedCount = Math.max(0, orgsInRange.length - verifiedCount)
      const verifiedPct = orgsInRange.length ? Math.round((verifiedCount / orgsInRange.length) * 100) : 0
      const incompleteCount = youthInRange.filter((p) => (Number(p.profileCompleteness) || 0) < 100).length
      const completeCount = Math.max(0, youthInRange.length - incompleteCount)
      const incompletePct = youthInRange.length
        ? Math.round(
            (incompleteCount / youthInRange.length) * 100
          )
        : 0
      const isYouthReport = adminTab === 'youth'
      const reportTitle = isYouthReport
        ? 'InternHub Admin Dashboard Report (Youth Profiles)'
        : 'InternHub Admin Dashboard Report (Organization Profiles)'

      const youthFilterSearchLabel = youthSearch.trim() ? youthSearch.trim() : 'All'
      const youthFilterProvinceLabel = province.trim() ? province.trim() : 'All'
      const youthFilterDistrictLabel = district.trim() ? district.trim() : 'All'
      const youthFilterRuralLabel =
        youthRuralFilter === 'all' ? 'All' : youthRuralFilter === 'rural' ? 'Rural only' : 'Non-rural only'

      const orgFilterSearchLabel = search.trim() ? search.trim() : 'All'
      const orgFilterVerifiedLabel =
        verifiedFilter === 'all' ? 'All' : verifiedFilter === 'true' ? 'Verified' : 'Not verified'
      const orgFilterIndustryLabel = industryFilter.trim() ? industryFilter.trim() : 'All'

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 14
      const sectionGap = 10
      const contentWidth = pageWidth - margin * 2
      let y = 14

      const drawPageHeader = () => {
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, pageWidth, 26, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(15)
        doc.text(reportTitle, margin, 12)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Generated: ${formatDate(new Date().toISOString())}`, margin, 19)
        doc.text(`Report Period: ${reportFromDate} to ${reportToDate}`, pageWidth - margin, 19, { align: 'right' })
        doc.setTextColor(31, 41, 55)
        let fy = 29
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text('Applied filters', margin, fy)
        fy += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        if (isYouthReport) {
          doc.text(`Search: ${youthFilterSearchLabel}`, margin, fy)
          fy += 4.5
          doc.text(`Province: ${youthFilterProvinceLabel}`, margin, fy)
          fy += 4.5
          doc.text(`District: ${youthFilterDistrictLabel}`, margin, fy)
          fy += 4.5
          doc.text(`Rural: ${youthFilterRuralLabel}`, margin, fy)
          fy += 4.5
        } else {
          doc.text(`Search: ${orgFilterSearchLabel}`, margin, fy)
          fy += 4.5
          doc.text(`Verified: ${orgFilterVerifiedLabel}`, margin, fy)
          fy += 4.5
          doc.text(`Industry: ${orgFilterIndustryLabel}`, margin, fy)
          fy += 4.5
        }
        y = fy + 8
      }

      const drawPageFooter = (pageNo, totalPages) => {
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('Confidential • InternHub Admin Report', margin, pageHeight - 7)
        doc.text(`Page ${pageNo} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
      }

      const ensureSpace = (needed = 16) => {
        if (y + needed > pageHeight - 22) {
          doc.addPage()
          drawPageHeader()
        }
      }

      const sectionTitle = (title) => {
        ensureSpace(14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(15, 23, 42)
        doc.text(title, margin, y)
        y += 8
      }

      const drawSummaryCard = (label, value, x, top, w) => {
        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(x, top, w, 20, 2, 2, 'FD')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(label, x + 3, top + 7)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(15, 23, 42)
        doc.text(String(value), x + 3, top + 16)
      }

      const drawTable = (title, columns, rows) => {
        sectionTitle(title)
        ensureSpace(16)
        const colWidths = columns.map((c) => c.width)
        const startX = margin
        const headerY = y
        doc.setFillColor(241, 245, 249)
        doc.rect(startX, headerY, contentWidth, 9, 'F')
        let x = startX
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(51, 65, 85)
        columns.forEach((col, i) => {
          doc.text(col.label, x + 2, headerY + 6)
          x += colWidths[i]
        })
        y += 10

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(30, 41, 59)
        if (rows.length === 0) {
          ensureSpace(12)
          doc.text('No records in selected period.', margin + 2, y + 7)
          y += 12
          return
        }

        rows.forEach((row, idx) => {
          const cellLines = columns.map((col) => doc.splitTextToSize(String(row[col.key] ?? '—'), col.width - 4))
          const lineCount = Math.max(...cellLines.map((l) => l.length), 1)
          const rowHeight = Math.max(10, lineCount * 4.5 + 3)
          ensureSpace(rowHeight + 3)

          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(startX, y, contentWidth, rowHeight, 'F')
          }

          let cellX = startX
          cellLines.forEach((lines, i) => {
            doc.text(lines, cellX + 2, y + 6)
            cellX += colWidths[i]
          })
          y += rowHeight + 1
        })
        y += sectionGap
      }

      drawPageHeader()

      sectionTitle('Executive Summary')
      ensureSpace(30)
      const cardGap = 4
      const summaryCards = isYouthReport
        ? [
            ['Youth Profiles', youthInRange.length],
            ['Incomplete Profiles', `${incompletePct}%`],
            ['Complete Profiles', completeCount],
            ['Incomplete Count', incompleteCount],
          ]
        : [
            ['Organizations', orgsInRange.length],
            ['Verified Orgs', verifiedCount],
            ['Unverified Orgs', unverifiedCount],
            ['Verified %', `${verifiedPct}%`],
          ]
      const cardW = (contentWidth - cardGap * 3) / 4
      const cardTop = y
      summaryCards.forEach((card, i) => {
        drawSummaryCard(card[0], card[1], margin + (cardW + cardGap) * i, cardTop, cardW)
      })
      y += 24 + sectionGap

      sectionTitle('Insights')
      ensureSpace(26)
      doc.setFillColor(239, 246, 255)
      doc.setDrawColor(191, 219, 254)
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(30, 64, 175)
      if (isYouthReport) {
        doc.text(`• ${youthInRange.length} youth users registered during this period.`, margin + 4, y + 6)
        doc.text(
          `• ${incompletePct}% profiles are incomplete (profile completeness below 100%).`,
          margin + 4,
          y + 12
        )
        doc.text(
          `• ${youthInRange.filter((p) => p.participationEligibility).length} users are currently eligible.`,
          margin + 4,
          y + 18
        )
      } else {
        doc.text(`• ${orgsInRange.length} organizations were active in this period.`, margin + 4, y + 6)
        doc.text(`• ${verifiedPct}% of organizations are verified.`, margin + 4, y + 12)
        doc.text(`• ${unverifiedCount} organizations are pending verification.`, margin + 4, y + 18)
      }
      y += 30 + sectionGap

      const youthRows = youthInRange.map((p, idx) => ({
        idx: idx + 1,
        name: p.fullName ?? '—',
        district: p.district ?? '—',
        strength: String(p.profileStrengthLevel ?? '—').toUpperCase(),
      }))
      if (isYouthReport) {
        drawTable(
          'Youth Profiles',
          [
            { label: '#', key: 'idx', width: 12 },
            { label: 'Name', key: 'name', width: 72 },
            { label: 'District', key: 'district', width: 56 },
            { label: 'Profile Strength', key: 'strength', width: 46 },
          ],
          youthRows
        )
      }

      const orgRows = orgsInRange.map((o, idx) => ({
        idx: idx + 1,
        name: o.organizationName ?? '—',
        industry: o.industry ?? '—',
        verified: o.verified ? 'Yes' : 'No',
        readiness: o.readinessStatus ?? '—',
      }))
      if (!isYouthReport) {
        drawTable(
          'Organization Profiles',
          [
            { label: '#', key: 'idx', width: 12 },
            { label: 'Name', key: 'name', width: 58 },
            { label: 'Industry', key: 'industry', width: 50 },
            { label: 'Verified', key: 'verified', width: 28 },
            { label: 'Readiness', key: 'readiness', width: 38 },
          ],
          orgRows
        )
      }

      const totalPages = doc.getNumberOfPages()
      for (let pageNo = 1; pageNo <= totalPages; pageNo += 1) {
        doc.setPage(pageNo)
        drawPageFooter(pageNo, totalPages)
      }

      doc.save(
        `${
          isYouthReport
            ? 'youth'
            : `organization-${industryFilter.trim() ? industryFilter.replace(/\s+/g, '-').toLowerCase() : 'all'}`
        }-report-${reportFromDate}-to-${reportToDate}.pdf`
      )
      toast.success('Report downloaded')
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setReportGenerating(false)
    }
  }

  const recentOrgVersionDates = (org) => {
    const versions = Array.isArray(org?.versions) ? org.versions : []
    return [...versions]
      .filter((v) => v?.changedAt)
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
      .slice(0, 3)
      .map((v) => formatActivityLine(v.changedAt))
  }

  const recentYouthVersionDates = (profile) => {
    const versions = Array.isArray(profile?.versions) ? profile.versions : []
    return [...versions]
      .filter((v) => v?.changedAt)
      .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
      .slice(0, 3)
      .map((v) => formatActivityLine(v.changedAt))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="section-title">Admin dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Youth and organization management.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setAdminTab('youth')}
          className={adminTab === 'youth' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
        >
          Youth Profiles
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('organizations')}
          className={adminTab === 'organizations' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
        >
          Organization Profiles
        </button>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="w-full lg:w-56">
            <label className="label">From Date</label>
            <input
              type="date"
              className="input"
              value={reportFromDate}
              onChange={(e) => setReportFromDate(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-56">
            <label className="label">To Date</label>
            <input
              type="date"
              className="input"
              value={reportToDate}
              onChange={(e) => setReportToDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={reportGenerating}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {reportGenerating ? <Loader2 size={15} className="animate-spin" /> : null}
            Download Report
          </button>
        </div>
      </div>

      {adminTab === 'youth' ? (
        <>
          <div className="card p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="label">Search</label>
                <input
                  className="input"
                  placeholder="Name, phone, district, or province"
                  value={youthSearch}
                  onChange={(e) => setYouthSearch(e.target.value)}
                />
              </div>
              <div className="w-full lg:w-48 min-w-[150px]">
                <label className="label">Province</label>
                <select
                  className="input"
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value)
                    setDistrict('')
                  }}
                >
                  <option value="">All provinces</option>
                  {SL_PROVINCE_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full lg:w-48 min-w-[150px]">
                <label className="label">District</label>
                <select
                  className="input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!province}
                >
                  <option value="">{province ? 'All districts' : 'Select province first'}</option>
                  {slDistrictsForProvince.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full lg:w-44 min-w-[140px]">
                <label className="label">Rural</label>
                <select className="input" value={youthRuralFilter} onChange={(e) => setYouthRuralFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="rural">Rural only</option>
                  <option value="non-rural">Non-rural only</option>
                </select>
              </div>
            </div>
          </div>

          <AdminYouthCharts profiles={filteredYouth} />

          <div className="card overflow-hidden">
            {youthLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-brand" />
              </div>
            ) : youthPaged.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                {youthProfiles.length === 0 ? 'No youth profiles found.' : 'No youth profiles match your filters.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Full Name', 'District', 'Technical Skills', 'Profile Strength', 'Eligibility', 'Actions'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-3"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {youthPaged.map((row) => {
                      const uid = youthUserId(row)
                      return (
                        <tr key={row._id ?? uid} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-navy-900">
                            <span className="inline-flex items-center flex-wrap gap-1">
                              {row.fullName ?? '—'}
                              {isNewWithinWindow(row.createdAt) ? (
                                <span className="badge-green text-[10px]">NEW</span>
                              ) : null}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{row.district ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                            {skillsDisplay(row.technicalSkills)}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{row.profileStrengthLevel ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {row.participationEligibility ? 'Eligible' : 'Not eligible'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openYouthDetails(uid)}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                View Profile
                              </button>
                              <button
                                type="button"
                                disabled={youthDeleting === uid}
                                onClick={() => handleDeleteYouth(uid)}
                                className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {youthDeleting === uid ? (
                                  <Loader2 size={14} className="animate-spin inline" />
                                ) : (
                                  'Delete Profile'
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!youthLoading && filteredYouth.length > 0 ? (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {youthPage} of {youthTotalPages} · {filteredYouth.length} profile
                  {filteredYouth.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={youthPage <= 1}
                    onClick={() => setYouthPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={youthPage >= youthTotalPages}
                    onClick={() => setYouthPage((p) => Math.min(youthTotalPages, p + 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <AdminOrganizationCharts organizations={allOrganizations} loading={loading} />

          <div className="card p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="flex-1">
                <label className="label">Search</label>
                <input
                  className="input"
                  placeholder="Name, industry, or location"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full lg:w-44">
                <label className="label">Verified</label>
                <select
                  className="input"
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </select>
              </div>
              <div className="w-full lg:w-52">
                <label className="label">Industry</label>
                <select
                  className="input"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                >
                  <option value="">All industries</option>
                  {industryOptions.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-brand" />
              </div>
            ) : paged.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">No organizations match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Organization', 'Industry', 'Location', 'Verified', 'Readiness', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paged.map((org) => (
                      <tr key={org._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-medium text-navy-900">
                          <span className="inline-flex items-center flex-wrap gap-1">
                            {org.organizationName ?? '—'}
                            {shouldShowNewOrgBadge(org) ? (
                              <span className="badge-green text-[10px]">NEW</span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{org.industry ?? '—'}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate">{org.location ?? '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{org.verified ? 'true' : 'false'}</td>
                        <td className="px-6 py-4 text-slate-600">{org.readinessStatus ?? '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openOrgDetails(org._id)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              View
                            </button>
                            {!org.verified ? (
                              <button
                                type="button"
                                disabled={verifying === org._id}
                                onClick={() => handleVerify(org._id)}
                                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                              >
                                {verifying === org._id ? (
                                  <Loader2 size={14} className="animate-spin inline" />
                                ) : (
                                  'Verify'
                                )}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={deleting === org._id}
                              onClick={() => handleDeleteOrg(org._id)}
                              className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {deleting === org._id ? <Loader2 size={14} className="animate-spin inline" /> : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 ? (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {page} of {totalPages} · {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {(detailOrg || detailLoading) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOrgDetails()
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="font-display font-bold text-lg text-navy-900">Organization details</h2>
              <button
                type="button"
                onClick={closeOrgDetails}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-brand" />
                </div>
              ) : detailOrg ? (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      ['Organization name', detailOrg.organizationName],
                      ['Contact number', detailOrg.contactNumber],
                      ['Industry', detailOrg.industry],
                      ['Organization type', detailOrg.organizationType],
                      ['Location', detailOrg.location],
                      ['Description', detailOrg.description],
                      ['Website', detailOrg.website],
                      [
                        'Profile completeness',
                        detailOrg.profileCompletenessPercentage != null
                          ? `${detailOrg.profileCompletenessPercentage}%`
                          : '—',
                      ],
                      ['Readiness', detailOrg.readinessStatus],
                      ['Can post internship', detailOrg.canPostInternship ? 'Yes' : 'No'],
                      ['Verified', detailOrg.verified ? 'Yes' : 'No'],
                    ].map(([label, val]) => (
                      <div key={label} className={label === 'Description' ? 'sm:col-span-2' : ''}>
                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</dt>
                        <dd className="text-navy-900 mt-0.5 break-words">
                          {label === 'Website' && val ? (
                            <a
                              href={val.includes('://') ? val : `https://${val}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand hover:underline inline-flex items-center gap-1"
                            >
                              {val}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            (val ?? '—')
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {Array.isArray(detailOrg.readinessSuggestions) && detailOrg.readinessSuggestions.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Readiness suggestions
                      </h3>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {detailOrg.readinessSuggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(detailOrg.documents) && detailOrg.documents.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Documents</h3>
                      <ul className="text-sm space-y-2">
                        {detailOrg.documents.map((doc, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2 text-slate-600">
                            <span className="font-medium text-navy-900">{doc.fileName ?? 'File'}</span>
                            {doc.type ? <span className="text-xs text-slate-400">({doc.type})</span> : null}
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                Open
                                <ExternalLink size={12} />
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(detailOrg.versions) && detailOrg.versions.length > 0 ? (
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="font-semibold text-navy-900 text-sm mb-3">Recent Activity</h3>
                      <p className="text-sm text-slate-600">
                        <span className="text-slate-400">Last updated:</span> {formatDate(detailOrg.updatedAt)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="text-slate-400">Total updates:</span> {detailOrg.versions.length}
                      </p>
                      <ul className="mt-3 text-sm text-slate-600 space-y-1">
                        {recentOrgVersionDates(detailOrg).map((line, i) => (
                          <li key={i}>• {line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {!detailOrg.verified ? (
                      <button
                        type="button"
                        disabled={verifying === detailOrg._id}
                        onClick={() => handleVerify(detailOrg._id)}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {verifying === detailOrg._id ? (
                          <Loader2 size={16} className="animate-spin inline" />
                        ) : (
                          'Verify'
                        )}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={deleting === detailOrg._id}
                      onClick={() => handleDeleteOrg(detailOrg._id)}
                      className="text-sm py-2 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deleting === detailOrg._id ? <Loader2 size={16} className="animate-spin inline" /> : 'Delete'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {(detailYouth || detailYouthLoading) && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeYouthDetails()
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="font-display font-bold text-lg text-navy-900">Youth profile</h2>
              <button
                type="button"
                onClick={closeYouthDetails}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {detailYouthLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-brand" />
                </div>
              ) : detailYouth ? (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      ['Full name', detailYouth.fullName],
                      ['Contact number', detailYouth.contactNumber],
                      ['District', detailYouth.district],
                      ['Province / state', detailYouth.provinceOrState],
                      ['Rural area', detailYouth.ruralAreaFlag ? 'Yes' : 'No'],
                      ['Gender', detailYouth.gender],
                      ['DOB', formatDate(detailYouth.DOB)],
                      ['Digital literacy', detailYouth.digitalLiteracyLevel],
                      ['Experience (years)', detailYouth.experienceYears],
                      ['Profile completeness', detailYouth.profileCompleteness != null ? `${detailYouth.profileCompleteness}%` : '—'],
                      ['Profile strength', detailYouth.profileStrengthLevel],
                      ['Participation eligibility', detailYouth.participationEligibility ? 'Eligible' : 'Not eligible'],
                      ['Eligibility score', detailYouth.eligibilityScore],
                      ['Preferred internship type', detailYouth.preferredInternshipType],
                      ['Transportation available', detailYouth.transportationAvailability ? 'Yes' : 'No'],
                      ['Internet access', detailYouth.internetAccess ? 'Yes' : 'No'],
                      ['Profile visibility', detailYouth.profileVisibility],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</dt>
                        <dd className="text-navy-900 mt-0.5 break-words">{val ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Technical skills</h3>
                    <p className="text-sm text-navy-900">{skillsDisplay(detailYouth.technicalSkills)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Soft skills</h3>
                    <p className="text-sm text-navy-900">{skillsDisplay(detailYouth.softSkills)}</p>
                  </div>

                  {detailYouth.education ? (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Education</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-navy-900">
                        <div>
                          <dt className="text-slate-400 text-xs">Qualification</dt>
                          <dd>{detailYouth.education.highestQualification ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400 text-xs">Institution</dt>
                          <dd>{detailYouth.education.institutionName ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400 text-xs">Field of study</dt>
                          <dd>{detailYouth.education.fieldOfStudy ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400 text-xs">Graduation year</dt>
                          <dd>{detailYouth.education.graduationYear ?? '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}

                  {Array.isArray(detailYouth.documents) && detailYouth.documents.length > 0 ? (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Documents</h3>
                      <ul className="text-sm space-y-2">
                        {detailYouth.documents.map((doc, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2 text-slate-600">
                            <span className="font-medium text-navy-900">{doc.fileName ?? 'File'}</span>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary text-xs py-1 px-2"
                              >
                                View
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {Array.isArray(detailYouth.versions) && detailYouth.versions.length > 0 ? (
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="font-semibold text-navy-900 text-sm mb-3">Version history</h3>
                      <p className="text-sm text-slate-600">
                        <span className="text-slate-400">Last updated:</span> {formatDate(detailYouth.updatedAt)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="text-slate-400">Total updates:</span> {detailYouth.versions.length}
                      </p>
                      <ul className="mt-3 text-sm text-slate-600 space-y-1">
                        {recentYouthVersionDates(detailYouth).map((line, i) => (
                          <li key={i}>• {line}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
