/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import { useWeb3 } from "../web3/useWeb3"
import { getEVoteContractWithSigner } from "../contracts/evote"
import { useToast } from "../components/Toaster"
import { sendTx } from "../web3/tx"
import { Skeleton } from "../components/Skeleton"

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
  const { signer, account } = useWeb3()
  const [openChart,setOpenChart] = useState(null)
  const toast = useToast()
  const [txBusy,setTxBusy] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")

  async function loadProposals(){

    try{

      setError("")
      setLoading(true)
      const contract = getEVoteContractWithSigner(signer)

      const count = await contract.proposalCount()

      let list = []

      for(let i=1;i<=Number(count);i++){

        const p = await contract.getProposal(i)

        const deadline = Number(p[7])
        const finalized = p[8]

        const yes = Number(p[5])
        const no = Number(p[6])

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

          result

        })

      }

      setProposals(list)

    }catch(err){

      console.error(err)
      setError(err?.shortMessage || err?.message || "Failed to load proposals")
      setProposals([])

    }finally{
      setLoading(false)
    }

  }

  useEffect(()=>{

    if(!signer) return
    loadProposals()

    const interval = setInterval(loadProposals,5000)

    return ()=>clearInterval(interval)

  },[signer])



  async function voteYes(id){

    if(!account){
      alert("Connect wallet")
      return
    }

    try{

      const contract = getEVoteContractWithSigner(signer)

      setTxBusy(`vote_yes_${id}`)
      const res = await sendTx(
        ()=>contract.vote(id,true),
        { toast, title:"Vote YES" }
      )
      setTxBusy(null)
      if(res.status === "success"){
        loadProposals()
      }

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function voteNo(id){

    if(!account){
      alert("Connect wallet")
      return
    }

    try{

      const contract = getEVoteContractWithSigner(signer)

      setTxBusy(`vote_no_${id}`)
      const res = await sendTx(
        ()=>contract.vote(id,false),
        { toast, title:"Vote NO" }
      )
      setTxBusy(null)
      if(res.status === "success"){
        loadProposals()
      }

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function finalize(id){

    try{

      const contract = getEVoteContractWithSigner(signer)

      setTxBusy(`finalize_${id}`)
      const res = await sendTx(
        ()=>contract.finalizeProposal(id),
        { toast, title:"Finalize proposal" }
      )
      setTxBusy(null)
      if(res.status === "success"){
        loadProposals()
      }

    }catch(err){

      console.error(err)
      alert("Finalize failed")

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



  return(

    <div className="w-full">

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-bold">DAO Voting Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Overview of proposals and live results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={loadProposals} disabled={!signer || loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card mb-6">
          <div className="card-inner">
            <p className="text-rose-300 font-semibold">Could not load proposals</p>
            <p className="text-slate-300 mt-1 text-sm break-words">{error}</p>
          </div>
        </div>
      )}

      {loading && proposals.length === 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card"><div className="card-inner space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-52 mt-2" />
          </div></div>
          <div className="card"><div className="card-inner space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-44 mt-2" />
          </div></div>
        </div>
      )}

      {!loading && proposals.length === 0 && !error && (
        <div className="card">
          <div className="card-inner">
            <p className="text-slate-300">No proposals yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              If you are admin, create one; otherwise head to Vote when proposals appear.
            </p>
          </div>
        </div>
      )}

      {proposals.map(p=>{

        const total = p.yes + p.no

        const yesPercent = total
          ? ((p.yes/total)*100).toFixed(1)
          : 0

        const noPercent = total
          ? ((p.no/total)*100).toFixed(1)
          : 0



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
              labels:{color:"white"}
            }
          },

          scales:{
            y:{
              ticks:{color:"white"}
            },
            x:{
              ticks:{color:"white"}
            }
          }

        }



        return(

          <div
          key={p.id}
          className="card mb-6"
          >
            <div className="card-inner">

            <p className="font-bold text-xl">
              {p.title}
            </p>

            <p className="text-gray-400">
              {p.description}
            </p>

            <p className="mt-2">
              Recipient: {p.recipient}
            </p>

            <p>
              Amount: {p.amount} ETH
            </p>

            <p>
              Deadline: {formatDeadline(p.deadline)}
            </p>



            <p className="mt-3">
              YES: {p.yes} ({yesPercent}%)
            </p>

            <p>
              NO: {p.no} ({noPercent}%)
            </p>



            <p className="mt-2">

              Status:

              {p.result === "ACTIVE" &&
                <span className="text-yellow-400 ml-2">
                  Voting...
                </span>
              }

              {p.result === "WAIT_FINALIZE" &&
                <span className="text-orange-400 ml-2">
                  Waiting Finalize
                </span>
              }

              {p.result === "APPROVED" &&
                <span className="text-green-400 ml-2">
                  APPROVED
                </span>
              }

              {p.result === "REJECTED" &&
                <span className="text-red-400 ml-2">
                  REJECTED
                </span>
              }

            </p>



            <button
            onClick={()=>toggleChart(p.id)}
            className="mt-4 btn-primary"
            >
              View Results {openChart === p.id ? "▲" : "▼"}
            </button>



            {openChart === p.id && (

              <div className="mt-6 flex flex-row justify-center items-center gap-10 flex-wrap">

                <div className="w-72">
                  <Pie data={pieData} options={chartOptions}/>
                </div>

                <div className="w-80">
                  <Bar data={barData} options={chartOptions}/>
                </div>

              </div>

            )}



            {p.result === "ACTIVE" && account && (

              <div className="flex gap-4 mt-6">

                <button
                onClick={()=>voteYes(p.id)}
                className="btn-success"
                disabled={txBusy != null}
                >
                  Vote YES
                </button>

                <button
                onClick={()=>voteNo(p.id)}
                className="btn-danger"
                disabled={txBusy != null}
                >
                  Vote NO
                </button>

              </div>

            )}



            {p.result === "WAIT_FINALIZE" && (

              <button
              onClick={()=>finalize(p.id)}
              className="mt-6 btn-purple"
              disabled={txBusy != null}
              >
                Finalize
              </button>

            )}

            </div>

          </div>

        )

      })}

    </div>

  )

}
