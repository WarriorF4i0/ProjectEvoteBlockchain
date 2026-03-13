import { useState } from "react"
import { ethers } from "ethers"
import { getContract } from "../abi/constract"

export default function CreateTx(){

  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")
  const [amount,setAmount] = useState("")
  const [endTime,setEndTime] = useState("")

  async function submit(){

    try{

      if(!title || !description){
        alert("Please enter title and description")
        return
      }

      if(!amount){
        alert("Enter amount")
        return
      }

      if(!endTime){
        alert("Select voting end time")
        return
      }

      // thời gian hiện tại
      const now = Math.floor(Date.now() / 1000)

      // thời gian user chọn
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000)

      // duration contract cần
      const duration = endTimestamp - now

      if(duration <= 0){
        alert("End time must be in the future")
        return
      }

      const accounts = await window.ethereum.request({
        method:"eth_accounts"
      })

      const recipient = accounts[0]

      const contract = await getContract()

      const value = ethers.parseEther(amount)

      const tx = await contract.createProposal(
        title,
        description,
        value,
        recipient,
        duration
      )

      await tx.wait()

      alert("Proposal created successfully")

      setTitle("")
      setDescription("")
      setAmount("")
      setEndTime("")

    }catch(err){

      console.error(err)
      alert("Transaction failed")

    }

  }

  return(

    <div className="max-w-xl">

      <h1 className="text-3xl mb-6 font-bold">
        Tạo Proposal Mới
      </h1>

      <div className="flex flex-col gap-4">

        <input
          placeholder="Tiêu đề"
          className="bg-gray-800 p-3 rounded"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />

        <textarea
          placeholder="chi tiết"
          className="bg-gray-800 p-3 rounded"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <input
          placeholder="Giá ETH (nếu có)"
          className="bg-gray-800 p-3 rounded"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
        />

        <label className="text-gray-400">
          Thời gian kết thúc voting
        </label>

        <input
          type="datetime-local"
          className="bg-gray-800 p-3 rounded"
          value={endTime}
          onChange={(e)=>setEndTime(e.target.value)}
        />

        <button
          onClick={submit}
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded"
        >
          Tạo Proposal
        </button>

      </div>

    </div>
  )
}