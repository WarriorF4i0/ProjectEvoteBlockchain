import Navbar from "./Navbar"
import Sidebar from "./Sidebar"

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-white">

      <Sidebar />

      <div className="flex flex-col flex-1">

        <Navbar />

        <main className="flex-1 p-8 w-full">
          {children}
        </main>

      </div>

    </div>
  )
}