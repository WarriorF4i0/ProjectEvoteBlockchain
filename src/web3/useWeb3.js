import { useContext } from "react"
import { Web3Context } from "./Web3Provider"

export function useWeb3(){
  const ctx = useContext(Web3Context)
  if(!ctx){
    throw new Error("useWeb3 must be used within Web3Provider")
  }
  return ctx
}

