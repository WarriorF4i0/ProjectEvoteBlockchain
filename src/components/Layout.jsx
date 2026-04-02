import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-white">

      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        <Navbar />

        <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.08),transparent)]"
            aria-hidden
          />
          <div className="relative z-10 w-full px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </div>
        </main>

      </div>

    </div>
  )
}
