import { useState } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "../web3/useWeb3"
import { getEVoteContractWithSigner } from "../contracts/evote"
import { useToast } from "../components/Toaster"
import { sendTx } from "../web3/tx"
import { EVOTE_ADDRESS } from "../contracts/addresses"
import { assertContractDeployed } from "../contracts/assertDeployed"

export default function CreateTx(){

  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")
  const [recipient,setRecipient] = useState("")
  const [amount,setAmount] = useState("")
  const [deadline,setDeadline] = useState("")
  const { signer } = useWeb3()
  const toast = useToast()
  const [submitting,setSubmitting] = useState(false)

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

      await assertContractDeployed({ signer, address: EVOTE_ADDRESS, label:"EVoteDAO" })
      const contract = getEVoteContractWithSigner(signer)

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

      setSubmitting(true)
      const res = await sendTx(()=>contract.createProposal(
          title,
          description,
          value,
          recipient,
          duration
        ),
        { toast, title:"Create proposal" }
      )

      if(res.status !== "success"){
        return
      }

      setTitle("")
      setDescription("")
      setRecipient("")
      setAmount("")
      setDeadline("")

    }catch(err){

      console.error(err)
      toast.push({ type:"error", title:"Transaction failed", message: err?.message || "Transaction failed" })

    }finally{
      setSubmitting(false)
    }

  }

  return(

    <div className="w-full max-w-2xl">

      <h1 className="text-3xl font-bold mb-2">
        Create Proposal
      </h1>

      <p className="text-slate-400 mb-6">
        Submit a new proposal for the DAO to vote on.
      </p>

      <div className="card">
        <div className="card-inner space-y-4">

          <div className="space-y-2">
            <label className="label">Title</label>
            <input
              placeholder="Proposal title"
              value={title}
              onChange={(e)=>setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="label">Description</label>
            <textarea
              placeholder="Describe the proposal..."
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              className="input min-h-28"
            />
          </div>

          <div className="space-y-2">
            <label className="label">Recipient Address</label>
            <input
              placeholder="0x..."
              value={recipient}
              onChange={(e)=>setRecipient(e.target.value)}
              className="input font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label">Amount (ETH)</label>
              <input
                placeholder="0.1"
                value={amount}
                onChange={(e)=>setAmount(e.target.value)}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Voting Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e)=>setDeadline(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <button
            onClick={createProposal}
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Create Proposal"}
          </button>

        </div>
      </div>

    </div>

  )

}
