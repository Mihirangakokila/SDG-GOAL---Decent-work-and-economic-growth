import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { internshipsAPI } from '../services/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  ArrowLeft, Eye, Users, CheckCircle2, TrendingUp,
  Clock, MapPin, Briefcase, Edit3, Loader2, Calendar
} from 'lucide-react'
import { formatDate, statusBadge, skillColor } from '../utils/helpers'

// ── Generate plausible daily data from createdAt → today ──────────────────────
// Since backend stores only totals, we distribute them across days with a
// realistic growth curve (slow start, picks up, plateaus)
const buildTimeSeries = (internship) => {
  const { viewCount = 0, totalApplicants = 0, createdAt } = internship

  const start  = new Date(createdAt)
  const today  = new Date()
  const diffMs = today - start
  const days   = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const cap    = Math.min(days, 30) // show at most 30 days

  // Weight curve: sigmoid-ish — slower at start, peak around day 5, gradual tail
  const weights = Array.from({ length: cap }, (_, i) => {
    const x = i / cap
    return Math.max(0.02, Math.sin(x * Math.PI) * (1 - x * 0.4))
  })
  const wSum = weights.reduce((a, b) => a + b, 0)

  let cumulViews = 0
  let cumulApps  = 0

  return Array.from({ length: cap }, (_, i) => {
    const date    = new Date(start)
    date.setDate(date.getDate() + i)
    const label   = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const w       = weights[i] / wSum

    const dailyViews = Math.round(viewCount * w)
    const dailyApps  = Math.round(totalApplicants * w)
    cumulViews += dailyViews
    cumulApps  += dailyApps

    return {
      date:        label,
      views:       dailyViews,
      applicants:  dailyApps,
      totalViews:  Math.min(cumulViews, viewCount),
      totalApps:   Math.min(cumulApps,  totalApplicants),
    }
  })
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-navy-900 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Colours ────────────────────────────────────────────────────────────────────
const BLUE   = '#1D4ED8'
const TEAL   = '#0d9488'
const AMBER  = '#f59e0b'
const RED    = '#ef4444'

export default function InternshipAnalyticsPage() {
  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const [internship, setInternship] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [chartType,  setChartType]  = useState('daily') // 'daily' | 'cumulative'

  useEffect(() => {
    internshipsAPI.getById(id)
      .then(res => setInternship(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )
  if (!internship) return null

  const {
    tittle, description, location, duration, status,
    requiredSkills = [], viewCount = 0,
    totalApplicants = 0, acceptedCount = 0, createdAt,
  } = internship

  const series        = buildTimeSeries(internship)
  const conversionRate = totalApplicants > 0
    ? ((acceptedCount / totalApplicants) * 100).toFixed(1)
    : '0.0'
  const viewToApply   = viewCount > 0
    ? ((totalApplicants / viewCount) * 100).toFixed(1)
    : '0.0'

  // Pie chart data
  const pieData = [
    { name: 'Accepted',  value: acceptedCount,                    color: '#10b981' },
    { name: 'Pending',   value: totalApplicants - acceptedCount,  color: BLUE      },
    { name: 'No Action', value: Math.max(0, viewCount - totalApplicants), color: '#e2e8f0' },
  ].filter(d => d.value > 0)

  const dataKey = chartType === 'daily'
    ? { views: 'views', apps: 'applicants' }
    : { views: 'totalViews', apps: 'totalApps' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Back + header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand transition-colors mb-3">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="section-title leading-tight line-clamp-2">{tittle}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={statusBadge(status)}>{status}</span>
            {location && (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin size={13} /> {location}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Clock size={13} /> {duration}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar size={13} /> Posted {formatDate(createdAt)}
            </span>
          </div>
        </div>
        <Link to={`/dashboard/edit/${id}`}
          className="btn-secondary flex-shrink-0 gap-2">
          <Edit3 size={14} /> Edit Listing
        </Link>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye}          color="blue"   label="Total Views"       value={viewCount}        />
        <KpiCard icon={Users}        color="purple" label="Total Applicants"  value={totalApplicants}  />
        <KpiCard icon={CheckCircle2} color="green"  label="Accepted"          value={acceptedCount}    />
        <KpiCard icon={TrendingUp}   color="amber"  label="View → Apply Rate" value={`${viewToApply}%`} />
      </div>

      {/* ── Charts grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Views & Applicants over time — takes 2/3 width */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-navy-900">Views & Applicants Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">Based on posting date distribution</p>
            </div>
            {/* Daily / Cumulative toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              {['daily', 'cumulative'].map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                    chartType === t
                      ? 'bg-white shadow-sm text-navy-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(series.length / 6)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle" iconSize={8}
                formatter={v => <span className="text-xs text-slate-600 capitalize">{v}</span>}
              />
              <Line
                type="monotone" dataKey={dataKey.views} name="Views"
                stroke={BLUE} strokeWidth={2.5} dot={false}
                activeDot={{ r: 4, fill: BLUE }}
              />
              <Line
                type="monotone" dataKey={dataKey.apps} name="Applicants"
                stroke={TEAL} strokeWidth={2.5} dot={false}
                activeDot={{ r: 4, fill: TEAL }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel pie — 1/3 width */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-1">Applicant Funnel</h2>
          <p className="text-xs text-slate-400 mb-5">Conversion breakdown</p>

          {totalApplicants === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
              <Users size={28} />
              <p className="text-sm">No applicants yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-navy-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Conversion rate callout */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Acceptance Rate</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-display font-bold text-navy-900">{conversionRate}%</span>
              <span className="text-xs text-slate-400 mb-1">of applicants</span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, parseFloat(conversionRate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily bar chart row ────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-bold text-navy-900 mb-1">Daily Views Breakdown</h2>
        <p className="text-xs text-slate-400 mb-6">Estimated daily view distribution since posting</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false} axisLine={false}
              interval={Math.floor(series.length / 6)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Views" fill={BLUE} radius={[4, 4, 0, 0]} />
            <Bar dataKey="applicants" name="Applicants" fill={TEAL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Summary info row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Quick stats */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-4">Performance Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Views',         value: viewCount },
              { label: 'Total Applicants',    value: totalApplicants },
              { label: 'Accepted',            value: acceptedCount },
              { label: 'View → Apply Rate',   value: `${viewToApply}%` },
              { label: 'Acceptance Rate',     value: `${conversionRate}%` },
              { label: 'Days Active',
                value: Math.ceil((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-navy-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-4">Required Skills</h2>
          {requiredSkills.length === 0 ? (
            <p className="text-sm text-slate-400">No skills listed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, i) => (
                <span key={skill}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${skillColor(i)}`}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="font-display font-semibold text-navy-900 text-sm mb-3">Description Preview</h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small KPI card ─────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, color, label, value }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-violet-50 text-violet-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
  }
  return (
    <div className="card p-5 animate-fade-up">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-display font-bold text-navy-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}
