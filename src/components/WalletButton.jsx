import { useState } from "react"
import { connectWallet } from "../abi/constract"

export default function WalletButton(){

  const [account,setAccount] = useState("")

  async function connect(){

    try{

      const addr = await connectWallet()

      setAccount(addr)

    }catch(err){
      console.log(err)
    }

  }

  return(

    <button
    onClick={connect}
    className="bg-green-600 px-4 py-2 rounded"
    >

      {account
        ? account.slice(0,6)+"..."+account.slice(-4)
        : "Connect Wallet"}

    </button>

  )
}