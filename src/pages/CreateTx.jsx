import { useState } from "react"

export default function CreateTx(){

  const [to,setTo]=useState("")
  const [amount,setAmount]=useState("")

  function submit(){

    console.log(to,amount)

  }

  return(

    <div className="max-w-xl">

      <h1 className="text-3xl mb-6 font-bold">
        Create Transaction
      </h1>

      <div className="flex flex-col gap-4">

        <input
        placeholder="Recipient Address"
        className="bg-gray-800 p-3 rounded"
        onChange={e=>setTo(e.target.value)}
        />

        <input
        placeholder="Amount (ETH)"
        className="bg-gray-800 p-3 rounded"
        onChange={e=>setAmount(e.target.value)}
        />

        <button
        onClick={submit}
        className="bg-blue-600 hover:bg-blue-500 p-3 rounded"
        >
        Submit Transaction
        </button>

      </div>

    </div>

  )

}