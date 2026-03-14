/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { getMultisigContract } from "../config/multisig"

export default function Multisig(){

  const [txs,setTxs] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    loadTx()
  },[])

  async function loadTx(){

    try{

      const contract = await getMultisigContract()

      const count = Number(await contract.transactionsLength())

      const list = []

      for(let i=0;i<count;i++){

        const tx = await contract.transactions(i)

        const amount = ethers.formatEther(tx.totalAmount)
        const perUser = ethers.formatEther(tx.amountPerUser)

        list.push({
          id:i,
          to:tx.to,
          amount:amount,
          amountPerUser:perUser,
          required:tx.requiredConfirmations.toString(),
          confirmations:tx.confirmCount.toString(),
          executed:tx.executed
        })

      }

      setTxs(list)

    }catch(err){
      console.error(err)
    }

    setLoading(false)

  }

  async function confirm(id,value){

    try{

      if(!value || value === "0"){
        alert("Invalid amount per voter")
        return
      }

      const contract = await getMultisigContract()

      const tx = await contract.confirmAndPay(
        id,
        {
          value: ethers.parseEther(value)
        }
      )

      await tx.wait()

      loadTx()

    }catch(err){

      console.error(err)
      alert(err.reason || "Confirm failed")

    }

  }

  async function execute(id){

    try{

      const contract = await getMultisigContract()

      const tx = await contract.executeTransaction(id)

      await tx.wait()

      loadTx()

    }catch(err){

      console.error(err)
      alert(err.reason || "Execute failed")

    }

  }

  if(loading){
    return <div style={{padding:"40px"}}>Loading...</div>
  }

  return(

    <div style={{padding:"40px"}}>

      <h2 style={{marginBottom:"25px"}}>Multisig Transactions</h2>

      {txs.length === 0 && (
        <p>No transactions yet</p>
      )}

      {txs.map(tx=>(

        <div 
          key={tx.id} 
          style={{
            background:"#020617",
            border:"1px solid #1e293b",
            padding:"28px",
            marginBottom:"25px",
            borderRadius:"12px",
            maxWidth:"700px"
          }}
        >

          <p><b>ID:</b> {tx.id}</p>

          <p>
            <b>Recipient:</b> {tx.to}
          </p>

          <p>
            <b>Total Amount:</b> {tx.amount} ETH
          </p>

          <p>
            <b>Amount per voter:</b> {tx.amountPerUser} ETH
          </p>

          <p>
            <b>Confirmations:</b> {tx.confirmations} / {tx.required}
          </p>

          <p>
            <b>Status:</b> {tx.executed ? "Executed" : "Pending"}
          </p>

          {!tx.executed && (

            <div style={{marginTop:"18px"}}>

              <button
                onClick={()=>confirm(tx.id,tx.amountPerUser)}
                style={{
                  background:"#f59e0b",
                  color:"#000",
                  border:"none",
                  padding:"10px 18px",
                  borderRadius:"8px",
                  cursor:"pointer",
                  fontWeight:"600"
                }}
              >
                Confirm & Pay
              </button>

              <button 
                onClick={()=>execute(tx.id)}
                style={{
                  marginLeft:"12px",
                  background:"#4f46e5",
                  color:"#fff",
                  border:"none",
                  padding:"10px 18px",
                  borderRadius:"8px",
                  cursor:"pointer",
                  fontWeight:"600"
                }}
              >
                Execute
              </button>

            </div>

          )}

        </div>

      ))}

    </div>

  )

}
