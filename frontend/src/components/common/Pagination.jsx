import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (page <= 4) return i + 1
    if (page >= totalPages - 3) return totalPages - 6 + i
    return page - 3 + i
  })

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <PageBtn n={1} active={page === 1} onClick={onChange} />
          {pages[0] > 2 && <span className="px-2 text-slate-400 text-sm">…</span>}
        </>
      )}

      {pages.map(n => (
        <PageBtn key={n} n={n} active={page === n} onClick={onChange} />
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-2 text-slate-400 text-sm">…</span>}
          <PageBtn n={totalPages} active={page === totalPages} onClick={onChange} />
        </>
      )}

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

const PageBtn = ({ n, active, onClick }) => (
  <button
    onClick={() => onClick(n)}
    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-brand text-white shadow-sm'
        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
    }`}
  >
    {n}
  </button>
)
