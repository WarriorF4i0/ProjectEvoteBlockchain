import WalletButton from "./WalletButton"

export default function Navbar(){

  return(

    <div className="flex justify-between p-4 bg-slate-950/40 border-b border-slate-800/70 backdrop-blur">

      <h1 className="text-xl">
        Blockchain dApp
      </h1>

      <WalletButton/>

    </div>

  )

}