import { useState } from "react"
import { ethers } from "ethers"
import { getEVoteContract } from "../config/evote"

export default function CreateTx(){

  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")
  const [recipient,setRecipient] = useState("")
  const [amount,setAmount] = useState("")
  const [deadline,setDeadline] = useState("")

  const inputStyle = {
    width:"100%",
    marginBottom:"15px",
    padding:"12px",
    borderRadius:"8px",
    border:"1px solid #1e293b",
    background:"#020617",
    color:"#e2e8f0",
    outline:"none"
  }

  async function createProposal(){

    if(!title || !description || !recipient || !deadline || !amount){
      alert("Missing fields")
      return
    }

    if(!ethers.isAddress(recipient)){
      alert("Invalid recipient address")
      return
    }

    if(Number(amount) <= 0){
      alert("Amount must be greater than 0")
      return
    }

    try{

      const contract = await getEVoteContract()

      // convert datetime-local -> duration
      const deadlineTimestamp = Math.floor(
        new Date(deadline).getTime()/1000
      )

      const now = Math.floor(Date.now()/1000)

      const duration = deadlineTimestamp - now

      if(duration <= 0){
        alert("Deadline must be in the future")
        return
      }

      const value = ethers.parseEther(amount)

      const tx = await contract.createProposal(
        title,
        description,
        value,
        recipient,
        duration
      )

      await tx.wait()

      alert("Proposal created")

      setTitle("")
      setDescription("")
      setRecipient("")
      setAmount("")
      setDeadline("")

    }catch(err){

      console.error(err)
      alert(err.reason || "Transaction failed")

    }

  }

  return(

    <div style={{padding:"40px",maxWidth:"600px"}}>

      <h2 style={{marginBottom:"20px"}}>Create Proposal</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e)=>setDescription(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e)=>setRecipient(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Amount (ETH)"
        value={amount}
        onChange={(e)=>setAmount(e.target.value)}
        style={inputStyle}
      />

      <label style={{display:"block",marginBottom:"6px"}}>
        Voting Deadline
      </label>

      <input
        type="datetime-local"
        value={deadline}
        onChange={(e)=>setDeadline(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={createProposal}
        style={{
          width:"100%",
          padding:"14px",
          background:"#2563eb",
          color:"#fff",
          border:"none",
          borderRadius:"10px",
          cursor:"pointer",
          fontWeight:"600"
        }}
      >
        Create Proposal
      </button>

    </div>

  )

}
