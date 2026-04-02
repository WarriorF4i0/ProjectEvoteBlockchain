import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { ref, set } from "firebase/database"
console.log("chay5 do đoayđoay");
import { getEVoteContract, EVOTE_ADDRESS } from "../config/evote"
import { ADMIN_ADDRESS } from "../config/admin"
import { db } from "../firebase"
import { normalizeWalletKey } from "../utils/wallet"

function formatProposalCreateError(err, contractAddr) {
  const reason =
    err?.reason ||
    err?.revert?.args?.[0]

  if (reason && typeof reason === "string") {
    if (/only admin/i.test(reason)) {
      return (
        `Contract trả về: "${reason}".\n\n` +
        "Phiên bản smart contract trên chain đang **chỉ cho admin** gọi createProposal. " +
        "Để mọi người đều tạo được proposal, bạn cần **deploy lại** EVoteDAO (bỏ onlyAdmin trên createProposal) " +
        "và cập nhật `EVOTE_ADDRESS` trong `src/config/evote.js`.\n\n" +
        `Địa chỉ hiện tại: ${contractAddr}`
      )
    }
    return reason
  }

  const short = err?.shortMessage || err?.message || ""

  if (err?.code === "CALL_EXCEPTION" || short.includes("missing revert")) {
    return (
      "Contract từ chối giao dịch (revert). RPC không trả về lý do chi tiết.\n\n" +
      "Thử kiểm tra: đúng mạng MetaMask, hoặc contract vẫn đang giới hạn chỉ admin tạo proposal.\n\n" +
      `Địa chỉ DAO: ${contractAddr}`
    )
  }

  return short || "Transaction failed"
}

export default function CreateTx(){

  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")
  const [recipient,setRecipient] = useState("")
  const [amount,setAmount] = useState("")
  const [deadline,setDeadline] = useState("")
  const [wallet,setWallet] = useState(()=>localStorage.getItem("wallet"))
  const [isAdmin,setIsAdmin] = useState(false)

  useEffect(()=>{

    function sync(){
      const w = localStorage.getItem("wallet")
      setWallet(w)
      setIsAdmin(Boolean(w && w.toLowerCase() === ADMIN_ADDRESS.toLowerCase()))
    }

    sync()
    window.addEventListener("walletChanged", sync)
    return ()=>window.removeEventListener("walletChanged", sync)

  },[])

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-600 outline-none ring-emerald-500/0 transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-45"

  async function createProposal(){

    if(isAdmin){
      alert("Admin không tạo proposal; chỉ duyệt (finalize) sau khi vote xong.")
      return
    }

    if(!wallet){
      alert("Kết nối ví trước (Kết nối ví trên góc màn hình).")
      return
    }

    if(!title || !description || !recipient || !deadline || !amount){
      alert("Điền đủ các trường.")
      return
    }

    if(!ethers.isAddress(recipient)){
      alert("Địa chỉ người nhận không hợp lệ.")
      return
    }

    if(Number(amount) <= 0){
      alert("Số tiền phải lớn hơn 0.")
      return
    }

    try{

      const provider = new ethers.BrowserProvider(window.ethereum)
      const code = await provider.getCode(EVOTE_ADDRESS)

      if(!code || code === "0x"){
        alert(
          `Không có bytecode tại ${EVOTE_ADDRESS} trên mạng MetaMask đang chọn. ` +
          "Hãy chuyển đúng network nơi bạn đã deploy DAO."
        )
        return
      }

      const contract = await getEVoteContract()

      const deadlineTimestamp = Math.floor(
        new Date(deadline).getTime()/1000
      )

      const now = Math.floor(Date.now()/1000)

      const duration = deadlineTimestamp - now

      if(duration <= 0){
        alert("Deadline phải ở tương lai.")
        return
      }

      const value = ethers.parseEther(amount)

      try{
        await contract.createProposal.staticCall(
          title,
          description,
          value,
          recipient,
          duration
        )
      }catch(simErr){
        console.error(simErr)
        alert(formatProposalCreateError(simErr, EVOTE_ADDRESS))
        return
      }

      const tx = await contract.createProposal(
        title,
        description,
        value,
        recipient,
        duration
      )

      await tx.wait()

      const count = Number(await contract.proposalCount())
      const creator = normalizeWalletKey(await contract.runner.getAddress())

      await set(ref(db, `proposalsMeta/${count}`), {
        id: count,
        title,
        createdBy: creator,
        createdAt: Date.now()
      })

      await set(ref(db, `userActivity/${creator}/created/${count}`), {
        proposalId: count,
        title,
        createdAt: Date.now()
      })

      alert("Đã tạo proposal thành công.")

      setTitle("")
      setDescription("")
      setRecipient("")
      setAmount("")
      setDeadline("")

      window.dispatchEvent(new Event("walletChanged"))

    }catch(err){

      console.error(err)
      alert(formatProposalCreateError(err, EVOTE_ADDRESS))

    }

  }

  return(

    <div className="w-full min-w-0 text-white">

      <h1 className="mb-8 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
        Tạo proposal
      </h1>

      <div className="w-full min-w-0 space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 shadow-xl lg:max-w-4xl">

        <input
          disabled={isAdmin || !wallet}
          placeholder="Tiêu đề"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          className={inputClass}
        />

        <textarea
          placeholder="Mô tả"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          className={`${inputClass} min-h-[100px] resize-y`}
          disabled={isAdmin || !wallet}
        />

        <input
          placeholder="Địa chỉ người nhận (0x...)"
          value={recipient}
          onChange={(e)=>setRecipient(e.target.value)}
          className={inputClass}
          disabled={isAdmin || !wallet}
        />

        <input
          placeholder="Số tiền (ETH)"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className={inputClass}
          disabled={isAdmin || !wallet}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Hạn vote
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e)=>setDeadline(e.target.value)}
            className={inputClass}
            disabled={isAdmin || !wallet}
          />
        </div>

        <button
          type="button"
          onClick={createProposal}
          disabled={isAdmin || !wallet}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 disabled:shadow-none"
        >
          Tạo proposal
        </button>

      </div>

    </div>

  )

}
