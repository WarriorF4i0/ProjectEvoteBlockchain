/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { getEVoteContract } from "../config/evote"
import { recordVoteFull } from "../utils/voteSync"
import { formatHiddenAddress, normalizeWalletKey } from "../utils/wallet"

export default function Vote(){

  const [proposals,setProposals] = useState([])
  const [admin,setAdmin] = useState("")
  const [account,setAccount] = useState("")

  useEffect(()=>{
    load()
    const t = setInterval(load, 5000)
    return ()=>clearInterval(t)
  },[])

  async function load(){

    const contract = await getEVoteContract()

    const signer = await contract.runner.getAddress()
    setAccount(signer.toLowerCase())

    const adminAddr = await contract.admin()
    setAdmin(adminAddr.toLowerCase())

    const count = Number(await contract.proposalCount())
    const now = Math.floor(Date.now()/1000)

    const list = []

    for(let i=1;i<=count;i++){

      const p = await contract.getProposal(i)

      const creator = p[9] != null && p[9] !== undefined
        ? String(p[9]).toLowerCase()
        : ""

      const deadline = Number(p[7])
      const finalized = p[8]
      const votingOpen = !finalized && now < deadline

      const reported = p[10] ?? false
      const reportCount = Number(p[11] ?? 0)

      const cancelled = await contract.cancelled(i)
      const cancelReason = await contract.cancelReason(i)

      list.unshift({
        id:Number(p[0]),
        title:p[1],
        description:p[2],
        amount:p[3],
        recipient:p[4],
        yes:Number(p[5]),
        no:Number(p[6]),
        deadline,
        finalized,
        creator,
        votingOpen,
        reported,
        reportCount,
        cancelled,
        cancelReason
      })

    }

    setProposals(list)

  }

  async function vote(id, value, title){

    if(account === admin){
      alert("Admin không vote.")
      return
    }

    const contract = await getEVoteContract()

    const tx = await contract.vote(id,value)
    await tx.wait()

    const signer = await contract.runner.getAddress()
    await recordVoteFull(id, signer, value, title)

    load()
  }

  async function endVotingEarly(id){

    try{
      const contract = await getEVoteContract()
      const tx = await contract.endVotingEarly(id)
      await tx.wait()
      load()
    }catch(err){
      console.error(err)
      alert(err?.reason || err?.shortMessage || "Lỗi")
    }

  }

  async function finalize(id){

    try{
      const contract = await getEVoteContract()
      const tx = await contract.finalizeProposal(id)
      await tx.wait()
      load()
    }catch(err){
      console.error(err)
      alert(err?.reason || err?.shortMessage || "Finalize failed")
    }

  }

  async function report(id){

    const reason = prompt("Nhập lý do report:")
    if(!reason) return

    try{
      const contract = await getEVoteContract()
      const tx = await contract.reportProposal(id, reason)
      await tx.wait()
      load()
    }catch(err){
      console.error(err)
      alert(err?.reason || err?.shortMessage || "Report failed")
    }

  }

  async function viewReports(id){

    try{
      const contract = await getEVoteContract()
      const data = await contract.getReports(id)

      if(!data.length){
        alert("Không có report")
        return
      }

      alert(
        data.map(r => `${r.reporter}\n${r.reason}`).join("\n\n")
      )

    }catch(err){
      console.error(err)
      alert("Không lấy được report")
    }

  }

  async function cancel(id){

    const reason = prompt("Nhập lý do huỷ proposal:")
    if(!reason) return

    try{
      const contract = await getEVoteContract()
      const tx = await contract.cancelProposal(id, reason)
      await tx.wait()
      load()
    }catch(err){
      console.error(err)
      alert(err?.reason || err?.shortMessage || "Cancel failed")
    }

  }

  return(

    <div className="w-full max-w-none text-white">

      <h1 className="mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Vote
      </h1>

      <div className="mx-auto w-full max-w-4xl space-y-6">

        {proposals.map(p=>{

          const total = p.yes + p.no
          const yesPercent = total ? ((p.yes/total)*100).toFixed(1) : 0
          const noPercent = total ? ((p.no/total)*100).toFixed(1) : 0

          const isAdmin = account === admin
          const canVote = !isAdmin && account && p.votingOpen && !p.cancelled

          const deadlineText = new Date(p.deadline*1000).toLocaleString()

          const w = normalizeWalletKey(account)
          const canEndEarly = Boolean(
            p.creator &&
            w &&
            w === p.creator &&
            p.votingOpen
          )

          const votingEnded = !p.finalized && !p.votingOpen

          return(

            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-lg"
            >

              <div className="border-b border-slate-800/80 px-6 py-5">
                <p className="text-xs font-medium text-slate-500">#{p.id}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{p.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{p.description}</p>
              </div>

              <div className="space-y-2 px-6 py-4 text-sm">
                <p>
                  <span className="text-slate-500">Người nhận:</span>{" "}
                  <span className="font-mono text-slate-200">
                    {formatHiddenAddress(p.recipient)}
                  </span>
                </p>

                <p>
                  <span className="text-slate-500">Số tiền:</span>{" "}
                  <span className="text-slate-200">
                    {ethers.formatEther(p.amount)} ETH
                  </span>
                </p>

                <p>
                  <span className="text-slate-500">Hạn:</span>{" "}
                  <span className="text-slate-200">{deadlineText}</span>
                </p>

                <p>
                  <span className="text-slate-500">YES / NO:</span>{" "}
                  <span className="text-emerald-300">{p.yes}</span>
                  {" / "}
                  <span className="text-rose-300">{p.no}</span>
                  <span className="text-slate-500">
                    ({yesPercent}% / {noPercent}%)
                  </span>
                </p>

                {p.reportCount > 0 && (
                  <p className="text-sm font-medium text-rose-400">
                    ⚠️ Proposal đang bị report ({p.reportCount})
                  </p>
                )}

                {p.cancelled && (
                  <p className="text-sm font-medium text-red-400">
                    ❌ Đã huỷ: {p.cancelReason}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-800/60 px-6 py-4">

                {/* FINALIZED → NO ACTIONS */}
                {p.finalized ? (
                  <p className="text-sm font-medium text-emerald-400">
                    Đã finalize.
                  </p>
                ) : (
                  <>
                    {canEndEarly && (
                      <button
                        onClick={()=>endVotingEarly(p.id)}
                        className="rounded-xl border border-slate-500 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        Kết thúc vote sớm
                      </button>
                    )}

                    {canVote && (
                      <>
                        <button
                          onClick={()=>vote(p.id,true,p.title)}
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                        >
                          Vote YES
                        </button>

                        <button
                          onClick={()=>vote(p.id,false,p.title)}
                          className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
                        >
                          Vote NO
                        </button>
                      </>
                    )}

                    {!isAdmin && !p.cancelled && (
                      <button
                        onClick={()=>report(p.id)}
                        className="rounded-xl border border-rose-500 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
                      >
                        Report ({p.reportCount})
                      </button>
                    )}

                    {isAdmin && p.reportCount > 0 && !p.cancelled && (
                      <>
                        <button
                          onClick={()=>viewReports(p.id)}
                          className="rounded-xl bg-yellow-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-yellow-500"
                        >
                          Xem report
                        </button>

                        <button
                          onClick={()=>cancel(p.id)}
                          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
                        >
                          Huỷ proposal
                        </button>
                      </>
                    )}

                    {isAdmin && votingEnded && !p.cancelled && (
                      <button
                        onClick={()=>finalize(p.id)}
                        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                      >
                        Finalize → Multisig
                      </button>
                    )}
                  </>
                )}

              </div>

            </article>

          )

        })}

      </div>

    </div>

  )

}