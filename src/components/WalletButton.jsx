import { useEffect } from "react"
import { db } from "../firebase"
import { ref, get, set } from "firebase/database"
import { useNavigate } from "react-router-dom"
import { useWeb3 } from "../web3/useWeb3"

export default function WalletButton(){

  const navigate = useNavigate()
  const {
    hasProvider,
    account,
    balanceEth,
    chainId,
    isCorrectNetwork,
    connecting,
    connect: web3Connect,
    disconnect,
    switchToHardhat
  } = useWeb3()

  const avatar = localStorage.getItem("avatar")

  async function connect(){

    try{

      const addr = await web3Connect()

      if(!addr) return

      const userRef = ref(db,"users/"+addr)

      const snapshot = await get(userRef)

      if(!snapshot.exists()){

        await set(userRef,{
          wallet: addr,
          name:"",
          age:"",
          avatar:"",
          createdAt: Date.now()
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

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      })
      await web3Connect()

    }catch(err){

      console.log(err)

    }

  }


  function logout(){

    disconnect()

    window.dispatchEvent(new Event("walletChanged"))

    navigate("/")

  }

  useEffect(()=>{
    if(account){
      try{ localStorage.setItem("wallet",account) }catch{}
    }
  },[account])

  if(!hasProvider){
    return (
      <span className="text-sm text-slate-300">
        MetaMask not found
      </span>
    )
  }

  if(!account){

    return(

      <button
        onClick={connect}
        className="btn-success"
        disabled={connecting}
      >
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>

    )

  }


  return(

    <div className="flex items-center gap-3">

      <img
        src={avatar || "/avatar-default.png"}
        className="w-8 h-8 rounded-full ring-2 ring-slate-800 object-cover"
      />

      <div className="flex flex-col leading-tight">
        <span className="font-mono text-sm">
          {account.slice(0,6)}...{account.slice(-4)}
        </span>
        <span className="text-xs text-slate-400">
          {balanceEth != null ? `${Number(balanceEth).toFixed(4)} ETH` : "-"} • Chain {chainId ?? "-"}
        </span>
      </div>

      {!isCorrectNetwork && (
        <button
          onClick={switchToHardhat}
          className="btn-primary px-3 py-2"
        >
          Switch Ganache
        </button>
      )}

      <button
        onClick={switchWallet}
        className="btn-warning px-3 py-2"
      >
        Switch
      </button>

      <button
        onClick={logout}
        className="btn-danger px-3 py-2"
      >
        Logout
      </button>

    </div>

  )

}