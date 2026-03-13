import { Link, useLocation } from "react-router-dom"

export default function Sidebar() {

  const location = useLocation()

  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Create Transaction", path: "/create" },
    { name: "Transaction History", path: "/history" },
    { name: "Multisig Wallet", path: "/multisig" },
    { name: "Profile", path: "/profile" },
    { name: "Vote", path: "/vote" }
  ]

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">

      <div className="p-6 text-xl font-bold text-white border-b border-slate-800">
        Blockchain dApp
      </div>

      <div className="flex flex-col p-3 gap-2">

        {menu.map((item) => (

          <Link
            key={item.path}
            to={item.path}
            className={`p-3 rounded-lg transition border-l-4
            ${
              location.pathname === item.path
                ? "border-blue-500 bg-blue-600 text-white font-bold text-lg"
                : "border-transparent text-gray-400 hover:bg-slate-800 hover:text-emerald-400 focus:text-emerald-400"
            }`}
          > 
            {item.name}
          </Link>

        ))}

      </div>

    </div>
  )
}