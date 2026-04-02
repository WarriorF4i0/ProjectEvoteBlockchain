import { useState, useEffect } from "react"
import { connectWallet } from "../abi/constract"
import { db } from "../firebase"
import { ref, get, set } from "firebase/database"
import { useNavigate } from "react-router-dom"
import { normalizeWalletKey, formatHiddenAddress } from "../utils/wallet"
import {
  markWalletExplicitLogout,
  clearWalletExplicitLogout,
  isWalletExplicitLogout
} from "../utils/sessionWallet"

export default function WalletButton(){

  const navigate = useNavigate()

  const [account,setAccount] = useState(null)
  const [avatar,setAvatar] = useState(()=>localStorage.getItem("avatar"))

  useEffect(()=>{

    function onAvatar(){
      setAvatar(localStorage.getItem("avatar"))
    }

    window.addEventListener("avatarUpdated", onAvatar)

    return ()=>window.removeEventListener("avatarUpdated", onAvatar)

  },[])

  useEffect(()=>{

    async function syncFromProvider(){

      if(!window.ethereum) return

      if(isWalletExplicitLogout()){
        setAccount(null)
        return
      }

      const accounts = await window.ethereum.request({
        method:"eth_accounts"
      })

      if(accounts.length>0){

        const addr = accounts[0]
        const key = normalizeWalletKey(addr)

        localStorage.setItem("wallet", key)
        setAccount(addr)

        const userRef = ref(db, `users/${key}`)
        const snapshot = await get(userRef)

        if(snapshot.exists()){

          const data = snapshot.val()
          if(data.avatar){
            localStorage.setItem("avatar", data.avatar)
            setAvatar(data.avatar)
          }

        }

      }else{

        setAccount(null)

      }

    }

    syncFromProvider()

    window.addEventListener("walletChanged", syncFromProvider)

    if(window.ethereum){
      window.ethereum.on("accountsChanged", syncFromProvider)
    }

    return ()=>{

      window.removeEventListener("walletChanged", syncFromProvider)
      if(window.ethereum){
        window.ethereum.removeListener("accountsChanged", syncFromProvider)
      }

    }

  },[])

  async function connect(){

    try{

      clearWalletExplicitLogout()

      const addr = await connectWallet()

      if(!addr) return

      const key = normalizeWalletKey(addr)

      localStorage.setItem("wallet", key)
      setAccount(addr)

      const userRef = ref(db, `users/${key}`)

      const snapshot = await get(userRef)

      if(!snapshot.exists()){

        await set(userRef,{
          wallet: key,
          displayAddress: addr,
          name:"",
          age:"",
          avatar:"",
          role: "member",
          createdAt: Date.now(),
          updatedAt: Date.now()
        })

        navigate("/profile")

      }else{

        const data = snapshot.val()

        if(!data.name){
          navigate("/profile")
        }else{
          navigate("/dashboard")
        }

      }

      window.dispatchEvent(new Event("walletChanged"))

    }catch(err){
      console.log(err)
    }

  }


  async function switchWallet(){

    try{

      clearWalletExplicitLogout()

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      })

      const accounts = await window.ethereum.request({
        method:"eth_accounts"
      })

      if(accounts.length){

        const addr = accounts[0]
        const key = normalizeWalletKey(addr)

        localStorage.setItem("wallet", key)
        setAccount(addr)

        const userRef = ref(db, `users/${key}`)
        const snapshot = await get(userRef)

        if(!snapshot.exists()){

          await set(userRef,{
            wallet: key,
            displayAddress: addr,
            name:"",
            age:"",
            avatar:"",
            role: "member",
            createdAt: Date.now(),
            updatedAt: Date.now()
          })

          navigate("/profile")

        }else{

          const data = snapshot.val()
          if(data.avatar){
            localStorage.setItem("avatar", data.avatar)
            setAvatar(data.avatar)
          }
          if(!data.name){
            navigate("/profile")
          }

        }

        window.dispatchEvent(new Event("walletChanged"))

      }

    }catch(err){

      console.log(err)

    }

  }


  function logout(){

    markWalletExplicitLogout()
    setAccount(null)
    localStorage.removeItem("wallet")
    localStorage.removeItem("avatar")

    window.dispatchEvent(new Event("walletChanged"))

    navigate("/")

  }


  if(!account){

    return(

      <button
        type="button"
        onClick={connect}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      >
        <span className="relative z-10">Kết nối ví</span>
      </button>

    )

  }


  return(

    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">

      <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 py-1.5 pl-1.5 pr-3 backdrop-blur-sm">
        <img
          src={avatar || "/avatar-default.png"}
          alt=""
          className="h-9 w-9 rounded-lg object-cover ring-2 ring-slate-700"
        />
        <span className="hidden font-mono text-xs text-slate-200 sm:inline" title={account}>
          {formatHiddenAddress(account)}
        </span>
      </div>

      <button
        type="button"
        onClick={switchWallet}
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20"
      >
        Đổi ví
      </button>

      <button
        type="button"
        onClick={logout}
        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
      >
        Thoát
      </button>

    </div>

  )

}
