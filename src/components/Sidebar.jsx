/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ADMIN_ADDRESS } from "../config/admin"

export default function Sidebar(){

  const location = useLocation()

  const [isAdmin,setIsAdmin] = useState(false)

  useEffect(()=>{

    checkWallet()

    function onWalletChanged(){
      checkWallet()
    }

    window.addEventListener("walletChanged", onWalletChanged)

    if(window.ethereum){
      window.ethereum.on("accountsChanged", checkWallet)
    }

    return ()=>{
      window.removeEventListener("walletChanged", onWalletChanged)
      if(window.ethereum){
        window.ethereum.removeListener("accountsChanged", checkWallet)
      }
    }

  },[])

  async function checkWallet(){

    if(!window.ethereum){
      setIsAdmin(false)
      return
    }

    const accounts = await window.ethereum.request({
      method:"eth_accounts"
    })

    if(accounts.length>0){

      if(accounts[0].toLowerCase() === ADMIN_ADDRESS.toLowerCase()){
        setIsAdmin(true)
      }else{
        setIsAdmin(false)
      }

    }else{
      setIsAdmin(false)
    }

  }

  const menu = [

    { name:"Dashboard", path:"/" },
    { name:"Vote", path:"/vote" },
    { name:"Multisig", path:"/multisig" },
    { name:"Lịch sử", path:"/history" },

  ]

  if(!isAdmin){
    menu.splice(3, 0, { name:"Tạo proposal", path:"/create" })
  }

  menu.push({ name:"Profile", path:"/profile" })

  return(

    <aside className="relative z-40 flex h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-800/90 bg-slate-900/95 sm:w-60">

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent" />

      <div className="relative flex flex-col p-5">

        <Link to="/" className="mb-8 flex items-center gap-3">

          <img
            src="./evote.jpg"
            alt="E-Vote DAO"
            className="w-full aspect-[16/9] object-cover rounded-xl"
          />

        </Link>

        {/* <Link to="/" className="mb-8 block"> <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90"> E‑Vote </p> <h1 className="text-xl font-bold tracking-tight text-white"> DAO </h1> </Link><Link to="/" className="mb-8 block"> <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90"> E‑Vote </p> <h1 className="text-xl font-bold tracking-tight text-white"> DAO </h1> </Link> */}

        <nav className="flex flex-col gap-1">
          {menu.map((item)=>{

            const active = location.pathname === item.path

            return(

              <Link key={item.path} to={item.path}>

                <span
                  className={`
                    block rounded-xl px-4 py-3 text-sm font-medium transition
                    ${active
                      ? "bg-gradient-to-r from-emerald-600/90 to-teal-600/80 text-white shadow-md shadow-emerald-900/20"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    }
                  `}
                >

                  {item.name}

                </span>

              </Link>

            )

          })}
        </nav>

      </div>

    </aside>

  )

}
