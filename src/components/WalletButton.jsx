import { useState } from "react"
import { connectWallet } from "../abi/constract"
import { db } from "../firebase"
import { ref, get, set } from "firebase/database"
import { useNavigate } from "react-router-dom"

export default function WalletButton(){

  const navigate = useNavigate()

  const [account,setAccount] = useState(null)

  const avatar = localStorage.getItem("avatar")

  async function connect(){

    try{

      const addr = await connectWallet()

      if(!addr) return

      setAccount(addr)

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

      const accounts = await window.ethereum.request({
        method:"eth_accounts"
      })

      if(accounts.length){

        setAccount(accounts[0])

      }

    }catch(err){

      console.log(err)

    }

  }


  function logout(){

    setAccount(null)

    window.dispatchEvent(new Event("walletChanged"))

    navigate("/")

  }


  if(!account){

    return(

      <button
        onClick={connect}
        className="bg-green-600 px-4 py-2 rounded"
      >
        Connect Wallet
      </button>

    )

  }


  return(

    <div className="flex items-center gap-3">

      <img
        src={avatar || "/avatar-default.png"}
        className="w-8 h-8 rounded-full"
      />

      <span>
        {account.slice(0,6)}...{account.slice(-4)}
      </span>

      <button
        onClick={switchWallet}
        className="bg-yellow-500 px-2 py-1 rounded text-sm"
      >
        Switch
      </button>

      <button
        onClick={logout}
        className="bg-red-500 px-2 py-1 rounded text-sm"
      >
        Logout
      </button>

    </div>

  )

}