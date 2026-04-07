import { useState, useRef } from 'react'
import { Search, MapPin, SlidersHorizontal, X, Tag } from 'lucide-react'

const EDUCATION_OPTIONS = ['', "Bachelor's", "Master's", "PhD", "Diploma", "Any"]
// Empty string = no status filter (shows all), matching backend behavior
const STATUS_OPTIONS = [
  { value: '',       label: 'All Statuses' },
  { value: 'Active', label: 'Active'       },
  { value: 'Closed', label: 'Closed'       },
  { value: 'Draft',  label: 'Draft'        },
]

export default function SearchBar({ params, onChange }) {
  const [showFilters, setShowFilters] = useState(false)

  // Skills are managed as a tag array internally, sent as clean comma string to backend
  const [skillInput, setSkillInput]   = useState('')
  const skillInputRef                 = useRef(null)

  // Parse current skills string → array (trim each, remove blanks)
  const skillsArray = (params.skills ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const set = (key, val) => onChange({ ...params, [key]: val, page: 1 })

  // Add a skill tag — sends trimmed, no-space comma list to backend
  const addSkill = (raw) => {
    const tag = raw.trim()
    if (!tag) return
    if (!skillsArray.includes(tag)) {
      // Join with comma only — NO spaces — so backend split(',') works perfectly
      set('skills', [...skillsArray, tag].join(','))
    }
    setSkillInput('')
  }

  const removeSkill = (tag) => {
    const next = skillsArray.filter(s => s !== tag).join(',')
    set('skills', next)
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && !skillInput && skillsArray.length > 0) {
      removeSkill(skillsArray[skillsArray.length - 1])
    }
  }

  // Keyword search is debounced via a small delay so it doesn't fire on every keystroke
  const keywordTimer = useRef(null)
  const handleKeyword = (val) => {
    clearTimeout(keywordTimer.current)
    keywordTimer.current = setTimeout(() => set('keyword', val), 350)
  }

  // Location: only search on Enter or blur to avoid hammering geocoder on every keystroke
  const [locationDraft, setLocationDraft] = useState(params.location ?? '')
  const commitLocation = () => {
    if (locationDraft !== params.location) set('location', locationDraft)
  }

  const clearAll = () => {
    setLocationDraft('')
    setSkillInput('')
    onChange({ ...params, keyword: '', location: '', skills: '', education: '', status: '', page: 1 })
  }

  const hasFilters = skillsArray.length > 0 || params.education || params.status

  return (
    <div className="space-y-3">

      {/* ── Main search row ─────────────────────────────────────── */}
      <div className="flex gap-3">

        {/* Keyword */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or keyword…"
            defaultValue={params.keyword ?? ''}
            onChange={e => handleKeyword(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Location — only commits on Enter or blur */}
        <div className="relative w-48 hidden sm:block">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="City or Remote…"
            value={locationDraft}
            onChange={e => setLocationDraft(e.target.value)}
            onBlur={commitLocation}
            onKeyDown={e => e.key === 'Enter' && commitLocation()}
            className="input pl-10"
          />
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 flex-shrink-0 ${showFilters ? 'bg-brand/5 border-brand/30 text-brand' : ''}`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-2 h-2 bg-brand rounded-full flex-shrink-0" />}
        </button>
      </div>

      {/* ── Expanded filters ────────────────────────────────────── */}
      {showFilters && (
        <div className="card p-5 space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Skills — tag-based input */}
            <div className="sm:col-span-2">
              <label className="label flex items-center gap-1.5">
                <Tag size={13} className="text-slate-400" /> Required Skills
              </label>

              {/* Tag chips + input combined */}
              <div
                onClick={() => skillInputRef.current?.focus()}
                className="input min-h-[44px] h-auto flex flex-wrap gap-1.5 cursor-text py-1.5"
              >
                {skillsArray.map(tag => (
                  <span key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex-shrink-0">
                    {tag}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeSkill(tag) }}
                      className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  ref={skillInputRef}
                  type="text"
                  placeholder={skillsArray.length === 0 ? 'Type a skill and press Enter…' : ''}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => addSkill(skillInput)}
                  className="flex-1 min-w-[140px] text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-xs">Enter</kbd> after each skill
              </p>
            </div>

            {/* Education */}
            <div>
              <label className="label">Required Education</label>
              <select
                value={params.education ?? ''}
                onChange={e => set('education', e.target.value)}
                className="input"
              >
                {EDUCATION_OPTIONS.map(o => (
                  <option key={o} value={o}>{o || 'Any level'}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label">Status</label>
              <select
                value={params.status ?? ''}
                onChange={e => set('status', e.target.value)}
                className="input"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear all */}
          {hasFilters && (
            <div className="flex justify-end pt-1 border-t border-slate-100">
              <button onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors">
                <X size={13} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
