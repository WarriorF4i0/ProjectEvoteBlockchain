function extractReason(err){
  if(!err) return "Transaction failed"
  const nested =
    err?.error?.message ||
    err?.error?.data?.message ||
    err?.data?.message ||
    err?.info?.error?.message ||
    err?.cause?.message

  const message = (
    err?.shortMessage ||
    err?.reason ||
    nested ||
    err?.message ||
    "Transaction failed"
  )

  if(typeof message === "string" && message.toLowerCase().includes("could not coalesce error")){
    return nested || "RPC/contract error. Check Ganache is running (127.0.0.1:7545, chainId 1337) and contract addresses match your latest deploy."
  }
  return (
    message
  )
}

export async function sendTx(run,{ toast, title } = {}){
  const toastId = toast?.push
    ? toast.push({ type:"loading", title: title ?? "Transaction pending", message:"Please confirm in your wallet", ttlMs: 0 })
    : null

  try{
    const tx = await run()
    if(toastId){
      toast.update(toastId,{ type:"loading", title: title ?? "Transaction sent", message: tx?.hash ? `Hash: ${tx.hash}` : "Waiting for confirmation...", ttlMs: 0 })
    }
    const receipt = await tx.wait()
    if(toastId){
      toast.update(toastId,{ type:"success", title: "Transaction confirmed", message: tx?.hash ? `Hash: ${tx.hash}` : "Success" })
    }
    return { status:"success", hash: tx?.hash, receipt }
  }catch(err){
    const reason = extractReason(err)
    if(toastId){
      toast.update(toastId,{ type:"error", title: "Transaction failed", message: reason })
    }else{
      toast?.push?.({ type:"error", title:"Transaction failed", message: reason })
    }
    return { status:"error", error: err, reason }
  }
}

