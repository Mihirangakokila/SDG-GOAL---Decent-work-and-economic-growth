import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, Loader2, RotateCcw, Sparkles } from 'lucide-react'

// ── InternHub system prompt ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are InternHub Assistant, a helpful AI guide for the InternHub internship portal.

Your role is to help:
- STUDENTS (youth): Find internships, understand how to apply, explain the CV matching system, guide them on improving their profile and match scores
- ORGANIZATIONS: Post internships, manage listings, understand the dashboard, analytics, and applicant tracking
- GENERAL VISITORS: Explain what InternHub is, how it works, and encourage sign-up

Key facts about InternHub:
- Students can browse and apply to internships by uploading their CV (PDF)
- An AI engine scores each applicant's CV against the internship requirements (0-100% match score)
- Organizations get email notifications when someone applies
- Organizations can view analytics: total views, applicants, acceptance rate, charts
- Location-based search finds internships within 50km using geocoding
- Real-time messaging between organizations and students via Socket.IO
- Organizations can post internships as Draft (hidden) or Active (visible to all)
- Students can withdraw applications if status is still "Applied"
- The portal sends automated emails for: new listings, applications received, status changes, weekly summaries

Be concise, friendly, and helpful. Use bullet points for lists. Keep responses under 150 words unless a detailed explanation is genuinely needed. If asked something outside InternHub scope, politely redirect to InternHub topics.`

// ── Suggested starter questions ────────────────────────────────────────────────
const SUGGESTIONS = [
  'How do I apply for an internship?',
  'How does the CV match score work?',
  'How do I post an internship as an organization?',
  'What is the analytics dashboard?',
]

// ── Format message text (bold **text**, line breaks) ──────────────────────────
const FormatMessage = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))
      })}
    </span>
  )
}

export default function ChatBot() {
  const [open,      setOpen]      = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages,  setMessages]  = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the **InternHub Assistant** 👋\n\nI can help you find internships, apply, post listings, or understand how the platform works. What can I help you with?",
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto scroll to latest message
  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, minimized])

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, minimized])

  const sendMessage = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    setError(null)

    const userMsg   = { role: 'user', content }
    const newMsgs   = [...messages, userMsg]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model:       'llama-3.3-70b-versatile',  // fast + free tier friendly
          max_tokens:  300,
          temperature: 0.7,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            // Send last 8 messages for context (keeps token cost low)
            ...newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `API error ${response.status}`)
      }

      const data    = await response.json()
      const reply   = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error('Groq API error:', err)
      setError(err.message ?? 'Failed to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm the **InternHub Assistant** 👋\n\nI can help you find internships, apply, post listings, or understand how the platform works. What can I help you with?",
    }])
    setError(null)
    setInput('')
  }

  // Unread dot — show when closed and more than 1 message exists
  const hasUnread = !open && messages.length > 1

  return (
    <>
      {/* ── Chat window ────────────────────────────────────────────── */}
      {open && (
        <div className={`fixed z-50 transition-all duration-300
                         bottom-24 right-24
                         ${minimized ? 'h-14' : 'h-[480px]'} w-80
                         bg-white rounded-2xl border border-slate-200 shadow-2xl
                         flex flex-col overflow-hidden animate-fade-up`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          bg-gradient-to-r from-navy-900 to-brand
                          text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={15} className="text-amber-300" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">InternHub AI</p>
                <p className="text-[10px] text-blue-200">
                  {loading ? 'Typing…' : 'Online · Powered by Groq'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleReset}
                title="New conversation"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setMinimized(m => !m)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/60">

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center
                                      flex-shrink-0 mr-2 mt-0.5">
                        <Sparkles size={11} className="text-brand" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'
                      }`}>
                      <FormatMessage text={msg.content} />
                    </div>
                  </div>
                ))}

                {/* Loading dots */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Sparkles size={11} className="text-brand" />
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-3 py-2.5">
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(j => (
                          <span key={j}
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
                    ⚠️ {error}
                  </div>
                )}

                {/* Suggestions — show only at start */}
                {messages.length === 1 && !loading && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-slate-400 font-medium">Try asking:</p>
                    {SUGGESTIONS.map(s => (
                      <button key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl
                                   bg-white border border-slate-200 text-slate-600
                                   hover:border-brand/40 hover:text-brand hover:bg-brand/5
                                   transition-all leading-snug">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-end gap-2 px-3 py-3 border-t border-slate-100 bg-white flex-shrink-0">
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Ask me anything…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="flex-1 resize-none text-sm px-3 py-2 rounded-xl
                             border border-slate-200 bg-slate-50
                             focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
                             placeholder:text-slate-400 disabled:opacity-60"
                  style={{ minHeight: '38px', maxHeight: '80px' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-brand text-white
                             flex items-center justify-center
                             hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed
                             active:scale-95 transition-all">
                  {loading
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Send size={14} />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Floating trigger button ─────────────────────────────────── */}
      <button
        onClick={() => { setOpen(o => !o); setMinimized(false) }}
        title="InternHub AI Assistant"
        className={`fixed bottom-24 right-6 z-50
                    w-14 h-14 rounded-full shadow-lg
                    flex items-center justify-center
                    transition-all duration-200 active:scale-95 hover:shadow-xl
                    ${open
                      ? 'bg-navy-900 text-white'
                      : 'bg-gradient-to-br from-violet-600 to-brand text-white hover:from-violet-500 hover:to-brand-light'
                    }`}
      >
        {open
          ? <X size={22} />
          : <Bot size={22} />
        }

        {/* Unread indicator */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400
                           border-2 border-white animate-pulse" />
        )}

        {/* Subtle pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
        )}
      </button>
    </>
  )
}
