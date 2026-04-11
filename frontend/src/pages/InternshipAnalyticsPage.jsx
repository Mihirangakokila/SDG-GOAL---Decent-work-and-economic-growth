import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { internshipsAPI, applicationsAPI } from '../services/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  ArrowLeft, Eye, Users, CheckCircle2, TrendingUp,
  Clock, MapPin, Edit3, Loader2, Calendar, Download, FileText
} from 'lucide-react'
import { formatDate, statusBadge, skillColor } from '../utils/helpers'

// ── Time series builder ────────────────────────────────────────────────────────
const buildTimeSeries = (internship) => {
  const { viewCount = 0, totalapplicants: totalApplicants = 0, createdAt } = internship
  const start  = new Date(createdAt)
  const today  = new Date()
  const days   = Math.max(1, Math.ceil((today - start) / (1000 * 60 * 60 * 24)))
  const cap    = Math.min(days, 30)
  const weights = Array.from({ length: cap }, (_, i) => {
    const x = i / cap
    return Math.max(0.02, Math.sin(x * Math.PI) * (1 - x * 0.4))
  })
  const wSum = weights.reduce((a, b) => a + b, 0)
  let cumulViews = 0, cumulApps = 0
  return Array.from({ length: cap }, (_, i) => {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const w = weights[i] / wSum
    const dailyViews = Math.round(viewCount * w)
    const dailyApps  = Math.round(totalApplicants * w)
    cumulViews += dailyViews
    cumulApps  += dailyApps
    return {
      date: label, views: dailyViews, applicants: dailyApps,
      totalViews: Math.min(cumulViews, viewCount),
      totalApps:  Math.min(cumulApps, totalApplicants),
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

const BLUE = '#1D4ED8', TEAL = '#0d9488'

// ── Report generator ───────────────────────────────────────────────────────────
const generateReport = (internship, applications, totalApplicants, acceptedCount, conversionRate, viewToApply) => {
  const now = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const statusColor = (s) => ({
    'Applied':     '#1d4ed8',
    'Under Review':'#d97706',
    'Accepted':    '#059669',
    'Rejected':    '#dc2626',
  }[s] ?? '#6b7280')

  const statusBg = (s) => ({
    'Applied':     '#eff6ff',
    'Under Review':'#fffbeb',
    'Accepted':    '#f0fdf4',
    'Rejected':    '#fef2f2',
  }[s] ?? '#f9fafb')

  const rows = applications.length > 0
    ? applications.map((app, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-weight:500;color:#111827">${app.name || '—'}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#374151">${app.email || '—'}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#374151">${app.phoneNumber || '—'}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="background:${statusBg(app.status)};color:${statusColor(app.status)};
                         padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">
              ${app.status}
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:#1d4ed8">
            ${app.eligibilityScore ?? 0}%
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px">
            ${app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'}
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="6" style="padding:32px;text-align:center;color:#9ca3af">No applications yet</td></tr>`

  // Score breakdown averages
  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((s, a) => s + (a.eligibilityScore ?? 0), 0) / applications.length)
    : 0

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Analytics Report — ${internship.tittle}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#f8fafc; color:#111827; }
    @media print {
      body { background:#fff; }
      .no-print { display:none !important; }
      .page-break { page-break-before: always; }
    }
    .container { max-width:900px; margin:0 auto; padding:32px 24px; }

    /* Header */
    .header { background:linear-gradient(135deg,#1e3a8a,#1d4ed8); color:#fff; border-radius:12px; padding:32px; margin-bottom:28px; }
    .header-top { display:flex; justify-content:space-between; align-items:flex-start; }
    .brand { font-size:13px; font-weight:600; letter-spacing:1px; opacity:0.7; text-transform:uppercase; margin-bottom:10px; }
    .report-title { font-size:22px; font-weight:700; line-height:1.3; margin-bottom:6px; }
    .report-meta { font-size:13px; opacity:0.75; }
    .print-btn { background:#fff; color:#1d4ed8; border:none; padding:10px 20px; border-radius:8px;
                 font-weight:700; font-size:14px; cursor:pointer; }
    .print-btn:hover { background:#eff6ff; }

    /* KPI grid */
    .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
    .kpi-card { background:#fff; border-radius:10px; padding:20px; border:1px solid #e2e8f0;
                box-shadow:0 1px 3px rgba(0,0,0,0.06); }
    .kpi-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;
                 color:#6b7280; margin-bottom:8px; }
    .kpi-value { font-size:28px; font-weight:800; color:#111827; }
    .kpi-sub   { font-size:12px; color:#9ca3af; margin-top:4px; }

    /* Section */
    .section { background:#fff; border-radius:10px; border:1px solid #e2e8f0;
               box-shadow:0 1px 3px rgba(0,0,0,0.06); margin-bottom:24px; overflow:hidden; }
    .section-header { padding:18px 24px; border-bottom:1px solid #f1f5f9; background:#f8fafc; }
    .section-title { font-size:15px; font-weight:700; color:#111827; }
    .section-sub   { font-size:12px; color:#6b7280; margin-top:2px; }
    .section-body  { padding:20px 24px; }

    /* Summary grid */
    .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .summary-row  { display:flex; justify-content:space-between; align-items:center;
                    padding:10px 0; border-bottom:1px solid #f1f5f9; }
    .summary-row:last-child { border-bottom:none; }
    .summary-label { font-size:13px; color:#6b7280; }
    .summary-value { font-size:13px; font-weight:700; color:#111827; }

    /* Status pills summary */
    .status-grid { display:flex; flex-wrap:wrap; gap:10px; padding:20px 24px; }
    .status-pill { display:flex; align-items:center; gap:8px; padding:10px 16px;
                   border-radius:8px; font-size:13px; font-weight:600; flex:1; min-width:160px; }

    /* Table */
    table { width:100%; border-collapse:collapse; }
    thead th { padding:12px 16px; background:#f8fafc; font-size:11px; font-weight:700;
               text-transform:uppercase; letter-spacing:0.5px; color:#6b7280;
               text-align:left; border-bottom:2px solid #e2e8f0; }
    thead th:nth-child(4),
    thead th:nth-child(5) { text-align:center; }

    /* Footer */
    .footer { text-align:center; padding:24px; font-size:12px; color:#9ca3af; }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand">InternHub — Analytics Report</div>
        <div class="report-title">${internship.tittle}</div>
        <div class="report-meta">
          ${internship.location ? `📍 ${internship.location} &nbsp;|&nbsp;` : ''}
          ${internship.duration ? `⏱ ${internship.duration} &nbsp;|&nbsp;` : ''}
          📅 Posted ${internship.createdAt ? new Date(internship.createdAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : '—'}
        </div>
        <div class="report-meta" style="margin-top:6px">Generated on ${now}</div>
      </div>
      <button class="print-btn no-print" onclick="window.print()">⬇ Download PDF</button>
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Views</div>
      <div class="kpi-value">${internship.viewCount ?? 0}</div>
      <div class="kpi-sub">Since posting</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Applicants</div>
      <div class="kpi-value">${totalApplicants}</div>
      <div class="kpi-sub">${applications.length} records loaded</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Accepted</div>
      <div class="kpi-value" style="color:#059669">${acceptedCount}</div>
      <div class="kpi-sub">Acceptance rate: ${conversionRate}%</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">View → Apply Rate</div>
      <div class="kpi-value">${viewToApply}%</div>
      <div class="kpi-sub">Avg match score: ${avgScore}%</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">Internship Summary</div>
      <div class="section-sub">Key details and performance metrics</div>
    </div>
    <div class="section-body">
      <div class="summary-grid">
        <div>
          ${[
            ['Status',          internship.status ?? '—'],
            ['Location',        internship.location ?? 'Not specified'],
            ['Duration',        internship.duration ?? 'Not specified'],
            ['Required Education', internship.requiredEducation ?? 'Any'],
            ['Days Active',     Math.ceil((new Date() - new Date(internship.createdAt)) / (1000*60*60*24)) + ' days'],
          ].map(([l,v]) => `
            <div class="summary-row">
              <span class="summary-label">${l}</span>
              <span class="summary-value">${v}</span>
            </div>`).join('')}
        </div>
        <div>
          ${[
            ['Total Views',       internship.viewCount ?? 0],
            ['Total Applicants',  totalApplicants],
            ['Accepted',          acceptedCount],
            ['Acceptance Rate',   conversionRate + '%'],
            ['Avg Match Score',   avgScore + '%'],
          ].map(([l,v]) => `
            <div class="summary-row">
              <span class="summary-label">${l}</span>
              <span class="summary-value">${v}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Application Status Breakdown -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">Application Status Breakdown</div>
    </div>
    <div class="status-grid">
      ${Object.entries(statusCounts).map(([status, count]) => `
        <div class="status-pill" style="background:${statusBg(status)};color:${statusColor(status)}">
          <span style="font-size:20px;font-weight:800">${count}</span>
          <span>${status}</span>
        </div>
      `).join('') || '<span style="color:#9ca3af;padding:0 4px">No applications yet</span>'}
    </div>
  </div>

  <!-- Required Skills -->
  ${internship.requiredSkills?.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <div class="section-title">Required Skills</div>
    </div>
    <div class="section-body" style="display:flex;flex-wrap:wrap;gap:8px">
      ${internship.requiredSkills.map(s => `
        <span style="background:#eff6ff;color:#1d4ed8;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600">${s}</span>
      `).join('')}
    </div>
  </div>` : ''}

  <!-- Applicants Table -->
  <div class="section page-break">
    <div class="section-header">
      <div class="section-title">Applicant Details</div>
      <div class="section-sub">${applications.length} applicant${applications.length !== 1 ? 's' : ''} listed</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Full Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
          <th>Match Score</th>
          <th>Applied Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="footer">
    InternHub Analytics Report &nbsp;|&nbsp; Generated ${now} &nbsp;|&nbsp; Confidential
  </div>

</div>
</body>
</html>`
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function InternshipAnalyticsPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [internship,   setInternship]   = useState(null)
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [chartType,    setChartType]    = useState('daily')

  useEffect(() => {
    const load = async () => {
      try {
        const [intRes, appRes] = await Promise.all([
          internshipsAPI.getById(id),
          // fetch applications for this internship via org endpoint
          internshipsAPI.getApplications?.(id).catch(() => ({ data: { data: [] } }))
            ?? Promise.resolve({ data: { data: [] } })
        ])
        setInternship(intRes.data)
        setApplications(appRes?.data?.data ?? [])
      } catch {
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      // Try to get fresh applicant data for the report
      let apps = applications
      try {
        const res = await internshipsAPI.getApplicationsByInternship(id)
        apps = res?.data?.data ?? res?.data?.applications ?? applications
      } catch {
        // fallback to whatever we already have
      }

      const html = generateReport(
        internship, apps, totalApplicants,
        acceptedCount, conversionRate, viewToApply
      )
      const blob   = new Blob([html], { type: 'text/html' })
      const url    = URL.createObjectURL(blob)
      const win    = window.open(url, '_blank')
      // Trigger print dialog after content loads
      if (win) {
        win.onload = () => {
          setTimeout(() => { win.print() }, 500)
        }
      }
      URL.revokeObjectURL(url)
    } finally {
      setReportLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  )
  if (!internship) return null

  const {
    tittle, description, location, duration, status,
    requiredSkills = [], viewCount = 0,
    totalapplicants: totalApplicants = 0,
    acceptedCount = 0, createdAt,
  } = internship

  const series = buildTimeSeries(internship)

  const conversionRate = totalApplicants > 0
    ? ((acceptedCount / totalApplicants) * 100).toFixed(1) : '0.0'
  const viewToApply = viewCount > 0
    ? ((totalApplicants / viewCount) * 100).toFixed(1) : '0.0'

  const pieData = [
    { name: 'Accepted',  value: acceptedCount,                          color: '#10b981' },
    { name: 'Pending',   value: totalApplicants - acceptedCount,         color: BLUE      },
    { name: 'No Action', value: Math.max(0, viewCount - totalApplicants),color: '#e2e8f0' },
  ].filter(d => d.value > 0)

  const dataKey = chartType === 'daily'
    ? { views: 'views', apps: 'applicants' }
    : { views: 'totalViews', apps: 'totalApps' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand transition-colors mb-3">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="section-title leading-tight line-clamp-2">{tittle}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={statusBadge(status)}>{status}</span>
            {location && <span className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} /> {location}</span>}
            {duration && <span className="flex items-center gap-1 text-sm text-slate-500"><Clock size={13} /> {duration}</span>}
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar size={13} /> Posted {formatDate(createdAt)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="btn-primary gap-2"
          >
            {reportLoading
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : <><FileText size={15} /> Generate Report</>
            }
          </button>
          <Link to={`/dashboard/edit/${id}`} className="btn-secondary gap-2">
            <Edit3 size={14} /> Edit Listing
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye}          color="blue"   label="Total Views"       value={viewCount}           />
        <KpiCard icon={Users}        color="purple" label="Total Applicants"  value={totalApplicants}     />
        <KpiCard icon={CheckCircle2} color="green"  label="Accepted"          value={acceptedCount}       />
        <KpiCard icon={TrendingUp}   color="amber"  label="View → Apply Rate" value={`${viewToApply}%`}  />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Line chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-navy-900">Views & Applicants Over Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">Based on posting date distribution</p>
            </div>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              {['daily', 'cumulative'].map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                    chartType === t ? 'bg-white shadow-sm text-navy-900' : 'text-slate-500 hover:text-slate-700'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.floor(series.length / 6)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-600 capitalize">{v}</span>} />
              <Line type="monotone" dataKey={dataKey.views} name="Views" stroke={BLUE} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: BLUE }} />
              <Line type="monotone" dataKey={dataKey.apps} name="Applicants" stroke={TEAL} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: TEAL }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-1">Applicant Funnel</h2>
          <p className="text-xs text-slate-400 mb-5">Conversion breakdown</p>
          {totalApplicants === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
              <Users size={28} /><p className="text-sm">No applicants yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Acceptance Rate</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-display font-bold text-navy-900">{conversionRate}%</span>
              <span className="text-xs text-slate-400 mb-1">of applicants</span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, parseFloat(conversionRate))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-6 mb-6">
        <h2 className="font-display font-bold text-navy-900 mb-1">Daily Views Breakdown</h2>
        <p className="text-xs text-slate-400 mb-6">Estimated daily view distribution since posting</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.floor(series.length / 6)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="views" name="Views" fill={BLUE} radius={[4, 4, 0, 0]} />
            <Bar dataKey="applicants" name="Applicants" fill={TEAL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary + Skills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-4">Performance Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Views',       value: viewCount },
              { label: 'Total Applicants',  value: totalApplicants },
              { label: 'Accepted',          value: acceptedCount },
              { label: 'View → Apply Rate', value: `${viewToApply}%` },
              { label: 'Acceptance Rate',   value: `${conversionRate}%` },
              { label: 'Days Active',       value: Math.ceil((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-navy-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-display font-bold text-navy-900 mb-4">Required Skills</h2>
          {requiredSkills.length === 0 ? (
            <p className="text-sm text-slate-400">No skills listed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((skill, i) => (
                <span key={skill} className={`px-3 py-1.5 rounded-full text-sm font-medium ${skillColor(i)}`}>{skill}</span>
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
