import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Loader2, Send, Sparkles } from 'lucide-react';
import { advisorChatApi } from '../api/advisorApi.js';

const WELCOME = `Hi! 👋 Nice to meet you.

I'm your AI career advisor. Share your skills or what you're studying, and I'll guide you with internships and courses tailored just for you.`;

const GREETING_REPLY = WELCOME;

function isSimpleGreeting(text) {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/[!?.…]+$/u, '')
    .trim();
  return [
    'hi',
    'hey',
    'hello',
    'hi there',
    'hey there',
    'hello there',
    'yo',
    'sup',
    'good morning',
    'good afternoon',
    'good evening',
    'hiya',
    'howdy',
  ].includes(s);
}

const CourseAdvisorPage = () => {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    const userMsg = { role: 'user', content: text };
    setInput('');

    if (isSimpleGreeting(text)) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: 'assistant', content: GREETING_REPLY },
      ]);
      return;
    }

    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setLoading(true);

    const payload = nextThread
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const { data } = await advisorChatApi(payload);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const code = err.response?.data?.code;
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      if (code === 'ADVISOR_DISABLED') {
        setError('');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'The advisor is not turned on yet on this server. An administrator needs to add OPENAI_API_KEY to the backend environment and restart the API. You can still browse all courses on the Skill Development page.',
          },
        ]);
      } else if (
        err.response?.status === 404 &&
        String(err.response?.data?.message || msg).toLowerCase().includes('route not found')
      ) {
        setError('');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'The server returned 404 for the advisor. Restart the backend after updating the code, and open http://127.0.0.1:5000/api/advisor/status in your browser — you should see JSON with chatPostPath. Restart the frontend dev server too.',
          },
        ]);
      } else if (!err.response) {
        setError(
          'Cannot reach the API. Start the backend (`npm run dev` in `backend`). Default API is http://127.0.0.1:5000 — set VITE_BACKEND_ORIGIN in frontend/.env.development to match your PORT, or set VITE_API_URL and restart the frontend dev server.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-brand/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-navy-700/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-medium text-slate-300 mb-4">
              <Sparkles size={16} className="text-cyan-300" />
              Learning path
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
              Course{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                advisor
              </span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed">
              Get personalized suggestions based on your goals and the courses organizers have
              published here.{' '}
              <Link
                to="/skill-development"
                className="text-cyan-300 hover:text-white underline underline-offset-2 font-medium"
              >
                Browse courses
              </Link>{' '}
              anytime.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="card overflow-hidden shadow-card max-w-3xl mx-auto flex flex-col min-h-[min(70vh,640px)] max-h-[min(85vh,760px)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15">
              <GraduationCap className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="font-display font-semibold text-navy-900 text-sm">Chat with your advisor</p>
              <p className="text-xs text-slate-500">Powered by your platform course catalog</p>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-slate-50/50"
            role="log"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand text-white rounded-br-md shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md'
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
                    {m.role === 'user' ? 'You' : 'Advisor'}
                  </p>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-3.5 py-3 text-sm text-slate-500 flex gap-2 shadow-sm max-w-[92%]">
                  <Loader2 className="h-4 w-4 animate-spin text-brand shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-medium text-slate-600">Thinking…</p>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      This can take up to a minute if the AI service is rate-limited — the server retries automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={send}
            className="border-t border-slate-100 bg-white p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
          >
            <label htmlFor="advisor-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="advisor-input"
              className="input min-h-[88px] max-h-40 resize-y flex-1 text-sm"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. I know basic HTML and CSS and want a front-end internship…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
            />
            <button
              type="submit"
              className="btn-primary shrink-0 sm:h-[52px] sm:px-6 inline-flex items-center justify-center gap-2"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseAdvisorPage;
