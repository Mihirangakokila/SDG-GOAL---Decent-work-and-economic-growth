import { TrendingUp } from 'lucide-react'

export default function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-100' },
    green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100' },
    purple: { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-100' },
    navy:   { bg: 'bg-navy-50',    icon: 'text-navy-600',    border: 'border-navy-100' },
  }
  const c = colors[color] ?? colors.blue

  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-3xl font-display font-bold text-navy-900">{value ?? '—'}</p>
          {trend != null && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp size={12} /> {trend}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </div>
  )
}
