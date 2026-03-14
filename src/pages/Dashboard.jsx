/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react"
import { getEVoteContract } from "../config/evote"

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
  const [wallet] = useState(()=>localStorage.getItem("wallet"))
  const [openChart,setOpenChart] = useState(null)

  async function loadProposals(){

    try{

      const contract = await getEVoteContract()

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

    }

  }

  useEffect(()=>{

    loadProposals()

    const interval = setInterval(loadProposals,5000)

    return ()=>clearInterval(interval)

  },[])



  async function voteYes(id){

    if(!wallet){
      alert("Connect wallet")
      return
    }

    try{

      const contract = await getEVoteContract()

      const tx = await contract.vote(id,true)

      await tx.wait()

      loadProposals()

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function voteNo(id){

    if(!wallet){
      alert("Connect wallet")
      return
    }

    try{

      const contract = await getEVoteContract()

      const tx = await contract.vote(id,false)

      await tx.wait()

      loadProposals()

    }catch(err){

      console.error(err)
      alert("Vote failed")

    }

  }



  async function finalize(id){

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

    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl mb-8 font-bold">
        DAO Voting Dashboard
      </h1>

      {proposals.length === 0 && (
        <p>No proposals yet</p>
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
          className="bg-gray-800 p-6 mb-6 rounded-xl"
          >

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
            className="mt-4 bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
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



            {p.result === "ACTIVE" && wallet && (

              <div className="flex gap-4 mt-6">

                <button
                onClick={()=>voteYes(p.id)}
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
                >
                  Vote YES
                </button>

                <button
                onClick={()=>voteNo(p.id)}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
                >
                  Vote NO
                </button>

              </div>

            )}



            {p.result === "WAIT_FINALIZE" && (

              <button
              onClick={()=>finalize(p.id)}
              className="mt-6 bg-purple-500 px-4 py-2 rounded hover:bg-purple-600"
              >
                Finalize
              </button>

            )}

          </div>

        )

      })}

    </div>

  )

}
