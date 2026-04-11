import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// ── Replace this with your real WhatsApp number (with country code, no + or spaces)
// Example: Sri Lanka +94 77 123 4567 → 94771234567
const WHATSAPP_NUMBER  = '94714950456'
const WHATSAPP_MESSAGE = 'Hi! I need guidance on finding an internship through InternHub.'

export default function Layout() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* ── Floating WhatsApp button ─────────────────────────── */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5
                   bg-[#25D366] hover:bg-[#20bc5a] active:scale-95
                   text-white rounded-full shadow-lg hover:shadow-xl
                   transition-all duration-200 group
                   px-4 py-3"
      >
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 flex-shrink-0"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                   -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075
                   -.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059
                   -.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52
                   .149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52
                   -.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                   -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372
                   -.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074
                   .149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625
                   .712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413
                   .248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.525 5.86L.057 23.143
                   a.75.75 0 00.914.914l5.283-1.468A11.944 11.944 0 0012 24
                   c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22
                   a9.944 9.944 0 01-5.058-1.376l-.361-.215-3.762 1.046
                   1.046-3.762-.215-.361A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2
                   s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>

        {/* Label — visible on hover (desktop) / always visible (mobile) */}
        <span className="text-sm font-semibold whitespace-nowrap
                         max-w-0 overflow-hidden group-hover:max-w-xs
                         transition-all duration-300 sm:block hidden">
          Need guidance?
        </span>
      </a>
    </div>
  )
}
