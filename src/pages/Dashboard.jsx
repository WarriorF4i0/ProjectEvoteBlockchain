/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { ref, get } from "firebase/database"
import { getEVoteContract } from "../config/evote"
import { ADMIN_ADDRESS } from "../config/admin"
import { db } from "../firebase"
import { formatHiddenAddress, normalizeWalletKey } from "../utils/wallet"
import { getProposalFlexible, resolveProposalCreator } from "../utils/proposalRead"
import { loadNoVoterAddresses } from "../utils/firebaseVotes"
import { recordVoteFull } from "../utils/voteSync"

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js"

import { Pie, Bar } from "react-chartjs-2"

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

export default function Dashboard(){

  const [proposals,setProposals] = useState([])
  const [wallet,setWallet] = useState(()=>normalizeWalletKey(localStorage.getItem("wallet") || ""))
  const [adminOnChain,setAdminOnChain] = useState("")
  const [openChart,setOpenChart] = useState(null)
  const [openVoters,setOpenVoters] = useState({})
  const [myCreated,setMyCreated] = useState([])

  useEffect(()=>{

    function syncWallet(){
      setWallet(normalizeWalletKey(localStorage.getItem("wallet") || ""))
    }

    window.addEventListener("walletChanged", syncWallet)
    return ()=>window.removeEventListener("walletChanged", syncWallet)

  },[])

  useEffect(()=>{

    async function loadCreated(){
      const w = normalizeWalletKey(localStorage.getItem("wallet") || "")
      if(!w){
        setMyCreated([])
        return
      }
      const snap = await get(ref(db, `userActivity/${w}/created`))
      if(!snap.exists()){
        setMyCreated([])
        return
      }
      const rows = Object.values(snap.val()).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))
      setMyCreated(rows)
    }

    loadCreated()

  }, [wallet])

  function toggleVoters(id){
    setOpenVoters((prev)=> ({ ...prev, [id]: !prev[id] }))
  }

  async function loadProposals(){

    try{

      const contract = await getEVoteContract()

      const adminAddr = (await contract.admin()).toLowerCase()
      setAdminOnChain(adminAddr)

      const count = await contract.proposalCount()

      const wRaw = normalizeWalletKey(localStorage.getItem("wallet") || "")
      let voteAddr = null
      if(wRaw){
        try{
          voteAddr = ethers.getAddress(wRaw)
        }catch{
          voteAddr = null
        }
      }

      let list = []

      for(let i=1;i<=Number(count);i++){

        const g = await getProposalFlexible(contract, i)
        if(!g.ok || !g.parts){
          continue
        }

        const p = g.parts

        const deadline = Number(p[7])
        const finalized = p[8]
        const creator = await resolveProposalCreator(i, p[9])

        const yes = Number(p[5])
        const no = Number(p[6])

        let iVoted = false
        if(voteAddr){
          iVoted = await contract.voted(i, voteAddr)
        }

        const yesVoterAddresses = []
        for(let vi = 0; vi < yes; vi++){
          const vAddr = await contract.yesVoters(i, vi)
          yesVoterAddresses.push(String(vAddr).toLowerCase())
        }

        const noVoterAddresses = await loadNoVoterAddresses(i)

        const now = Math.floor(Date.now()/1000)

        let result = "ACTIVE"

        if(finalized){

          const total = yes + no

          if(total === 0){
            result = "REJECTED"
          }else{

            const percent = (yes * 100) / total

            result = percent >= 70
              ? "APPROVED"
              : "REJECTED"

          }

        }else{

          if(now >= deadline){
            result = "WAIT_FINALIZE"
          }

        }

        list.push({

          id:Number(p[0]),
          title:p[1],
          description:p[2],

          amount:p[3].toString(),
          recipient:p[4],

          yes,
          no,

          deadline,
          finalized,

          result,

          yesVoterAddresses,
          noVoterAddresses,

          iVoted,

          creator

        })

      }

      setProposals(list)

    }catch(err){

      console.error(err)

    }

  }

  useEffect(()=>{

    loadProposals()

    const interval = setInterval(loadProposals,5000)

    return ()=>clearInterval(interval)

  }, [wallet])



  async function voteYes(id){

    if(!wallet){
      alert("Kết nối ví trước.")
      return
    }

    if(wallet === adminOnChain || wallet === ADMIN_ADDRESS.toLowerCase()){
      alert("Admin không tham gia vote.")
      return
    }

    try{

      const contract = await getEVoteContract()

      const tx = await contract.vote(id,true)

      await tx.wait()

      const signer = await contract.runner.getAddress()
      const title = proposals.find((pr)=>pr.id===id)?.title ?? ""
      await recordVoteFull(id, signer, true, title)

      loadProposals()

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function voteNo(id){

    if(!wallet){
      alert("Kết nối ví trước.")
      return
    }

    if(wallet === adminOnChain || wallet === ADMIN_ADDRESS.toLowerCase()){
      alert("Admin không tham gia vote.")
      return
    }

    try{

      const contract = await getEVoteContract()

      const tx = await contract.vote(id,false)

      await tx.wait()

      const signer = await contract.runner.getAddress()
      const title = proposals.find((pr)=>pr.id===id)?.title ?? ""
      await recordVoteFull(id, signer, false, title)

      loadProposals()

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function finalize(id){

    const w = normalizeWalletKey(wallet)
    const adminLower = (adminOnChain || ADMIN_ADDRESS.toLowerCase()).toLowerCase()

    if(w !== adminLower){
      alert("Chỉ admin mới có thể finalize.")
      return
    }

    try{

      const contract = await getEVoteContract()

      const tx = await contract.finalizeProposal(id)

      await tx.wait()

      loadProposals()

    }catch(err){

      console.error(err)
      alert("Finalize failed")

    }

  }

  async function endVotingEarly(id){

    try{

      const contract = await getEVoteContract()

      const tx = await contract.endVotingEarly(id)

      await tx.wait()

      loadProposals()

    }catch(err){

      console.error(err)
      alert(err?.reason || err?.shortMessage || "Không kết thúc sớm được")

    }

  }



  function toggleChart(id){

    if(openChart === id){
      setOpenChart(null)
    }else{
      setOpenChart(id)
    }

  }



  function formatDeadline(ts){

    const date = new Date(ts*1000)

    return date.toLocaleString()

  }

  const votedActive = proposals.filter((p)=>p.iVoted && (p.result==="ACTIVE" || p.result==="WAIT_FINALIZE"))
  const votedPast = proposals.filter((p)=>p.iVoted && (p.result==="APPROVED" || p.result==="REJECTED"))



  return(

    <div className="w-full max-w-none text-white">

      <h1 className="mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Dashboard
      </h1>

      {wallet && (

        <section className="mb-10 grid gap-6 rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-6 shadow-xl shadow-black/20 backdrop-blur md:grid-cols-2">

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Hoạt động của tôi
            </h2>
            <p className="mt-1 font-mono text-xs text-emerald-300/90" title={wallet}>
              {formatHiddenAddress(wallet)}
            </p>

            <div className="mt-4 space-y-3">

              <h3 className="text-xs font-medium text-amber-200/90">Đang vote / chờ duyệt</h3>
              {votedActive.length === 0 ? (
                <p className="text-sm text-slate-500">Không có.</p>
              ) : (
                <ul className="space-y-2">
                  {votedActive.map((p)=>(
                    <li
                      key={p.id}
                      className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-200">#{p.id} {p.title}</span>
                      <span className="ml-2 text-xs text-slate-500">— {p.result}</span>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="text-xs font-medium text-slate-300">Đã kết thúc (đã tham gia vote)</h3>
              {votedPast.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có.</p>
              ) : (
                <ul className="space-y-2">
                  {votedPast.map((p)=>(
                    <li
                      key={p.id}
                      className="rounded-lg border border-slate-700/50 bg-slate-950/40 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-200">#{p.id} {p.title}</span>
                      <span className="ml-2 text-xs text-slate-500">— {p.result}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proposal bạn đã tạo
            </h3>
            {myCreated.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Chưa có.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {myCreated.map((c)=>(
                  <li
                    key={c.proposalId}
                    className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-100/90"
                  >
                    #{c.proposalId} {c.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </section>
      )}

      {proposals.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          Chưa có proposal nào.
        </p>
      )}

      <div className="space-y-8">
        {proposals.map(p=>{

          const total = p.yes + p.no

          const yesPercent = total
            ? ((p.yes/total)*100).toFixed(1)
            : 0

          const noPercent = total
            ? ((p.no/total)*100).toFixed(1)
            : 0

          const isAdminUser = Boolean(
            wallet && adminOnChain && wallet === adminOnChain
          )

          const canEndEarly = Boolean(
            p.creator &&
            wallet &&
            wallet === p.creator &&
            p.result === "ACTIVE"
          )



          const pieData = {

            labels:["YES","NO"],

            datasets:[{

              data:[p.yes,p.no],

              backgroundColor:[
                "#22c55e",
                "#ef4444"
              ],

              hoverOffset:10

            }]

          }



          const barData = {

            labels:["YES","NO"],

            datasets:[{

              label:"Votes",

              data:[p.yes,p.no],

              backgroundColor:[
                "#22c55e",
                "#ef4444"
              ]

            }]

          }



          const chartOptions = {

            plugins:{
              legend:{
                labels:{color:"#cbd5e1", padding:16}
              }
            },

            scales:{
              y:{
                ticks:{color:"#94a3b8"},
                grid:{color:"rgba(148,163,184,0.12)"}
              },
              x:{
                ticks:{color:"#94a3b8"},
                grid:{color:"rgba(148,163,184,0.08)"}
              }
            }

          }

          const statusClass =
            p.result === "ACTIVE" ? "bg-amber-500/15 text-amber-200 border-amber-500/30"
              : p.result === "WAIT_FINALIZE" ? "bg-orange-500/15 text-orange-200 border-orange-500/30"
                : p.result === "APPROVED" ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-200 border-rose-500/30"



          return(

            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-lg shadow-black/20"
            >

              <div className="border-b border-slate-800/80 bg-slate-950/50 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Proposal #{p.id}</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      {p.title}
                    </h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
                    {p.result === "ACTIVE" && "Đang vote"}
                    {p.result === "WAIT_FINALIZE" && "Chờ admin duyệt"}
                    {p.result === "APPROVED" && "Đã duyệt"}
                    {p.result === "REJECTED" && "Không đạt"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {p.description}
                </p>
              </div>

              <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl bg-slate-950/50 px-4 py-3 ring-1 ring-slate-800/80">
                  <p className="text-xs text-slate-500">Người nhận</p>
                  <p className="mt-1 font-mono text-sm text-slate-200" title={p.recipient}>
                    {formatHiddenAddress(p.recipient)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/50 px-4 py-3 ring-1 ring-slate-800/80">
                  <p className="text-xs text-slate-500">Số tiền</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {ethers.formatEther(p.amount)} ETH
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/50 px-4 py-3 ring-1 ring-slate-800/80">
                  <p className="text-xs text-slate-500">Hạn vote</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {formatDeadline(p.deadline)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/50 px-4 py-3 ring-1 ring-slate-800/80">
                  <p className="text-xs text-slate-500">Tỷ lệ YES / NO</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {yesPercent}% / {noPercent}%
                  </p>
                </div>

              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-800/60 px-6 py-4">

                <button
                  type="button"
                  onClick={()=>toggleChart(p.id)}
                  className="rounded-lg bg-blue-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  {openChart === p.id ? "Ẩn biểu đồ" : "Xem biểu đồ"}
                </button>

                <button
                  type="button"
                  onClick={()=>toggleVoters(p.id)}
                  className="rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                  {openVoters[p.id] ? "Ẩn người vote" : "Xem người đã vote"}
                </button>

              </div>



              {openChart === p.id && (

                <div className="grid gap-10 border-t border-slate-800/60 bg-slate-950/30 px-6 py-8 xl:grid-cols-2 xl:gap-16">

                  <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 shadow-inner">
                    <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tỷ lệ
                    </p>
                    <div className="mx-auto max-w-[280px]">
                      <Pie data={pieData} options={chartOptions}/>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 shadow-inner">
                    <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Số phiếu
                    </p>
                    <div className="mx-auto max-w-[320px]">
                      <Bar data={barData} options={chartOptions}/>
                    </div>
                  </div>

                </div>

              )}


              {openVoters[p.id] && (

                <div className="grid gap-10 border-t border-slate-800/60 bg-slate-950/20 px-6 py-8 lg:grid-cols-2 lg:gap-20">

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-emerald-400">
                      Phiếu YES
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40">
                      <table className="w-full text-sm">
                        <tbody>
                          {p.yesVoterAddresses.length === 0 ? (
                            <tr>
                              <td className="p-3 text-slate-500">Chưa có</td>
                            </tr>
                          ) : (
                            p.yesVoterAddresses.map((addr)=>(
                              <tr key={`y-${addr}`} className="border-t border-slate-800">
                                <td className="p-2.5 pl-4 font-mono text-xs text-slate-200 sm:text-sm" title={addr}>
                                  {formatHiddenAddress(addr)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-red-400">
                      Phiếu NO
                    </h4>
                    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40">
                      <table className="w-full text-sm">
                        <tbody>
                          {p.noVoterAddresses.length === 0 ? (
                            <tr>
                              <td className="p-3 text-slate-500">Chưa có (đồng bộ qua app khi vote NO)</td>
                            </tr>
                          ) : (
                            p.noVoterAddresses.map((addr)=>(
                              <tr key={`n-${addr}`} className="border-t border-slate-800">
                                <td className="p-2.5 pl-4 font-mono text-xs text-slate-200 sm:text-sm" title={addr}>
                                  {formatHiddenAddress(addr)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              )}



              <div className="flex flex-wrap items-center gap-3 border-t border-slate-800/60 px-6 py-5">

                {canEndEarly && (
                  <button
                    type="button"
                    onClick={()=>endVotingEarly(p.id)}
                    className="rounded-xl border border-slate-500 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    Kết thúc vote sớm
                  </button>
                )}

                {p.result === "ACTIVE" && wallet && !isAdminUser && (

                  <>

                    <button
                      type="button"
                      onClick={()=>voteYes(p.id)}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow shadow-emerald-900/30 transition hover:bg-emerald-500"
                    >
                      Vote YES
                    </button>

                    <button
                      type="button"
                      onClick={()=>voteNo(p.id)}
                      className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow shadow-rose-900/30 transition hover:bg-rose-500"
                    >
                      Vote NO
                    </button>

                  </>

                )}

                {p.result === "WAIT_FINALIZE" && isAdminUser && (

                  <button
                    type="button"
                    onClick={()=>finalize(p.id)}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow shadow-violet-900/30 transition hover:bg-violet-500"
                  >
                    Finalize → Multisig
                  </button>

                )}

              </div>

            </article>

          )

        })}
      </div>

    </div>

  )

}
