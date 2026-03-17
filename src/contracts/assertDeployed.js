export async function assertContractDeployed({ signer, address, label }){
  if(!signer) throw new Error("Wallet not connected")
  const provider = signer.provider
  if(!provider) return

  const code = await provider.getCode(address)
  if(!code || code === "0x"){
    throw new Error(`${label ?? "Contract"} not deployed at ${address}. Update addresses and redeploy on current network.`)
  }
}

