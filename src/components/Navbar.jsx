import WalletButton from "./WalletButton"

export default function Navbar(){

  return(

    <header className="z-30 shrink-0 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">

      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">

        <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          E‑Vote DAO
        </h1>

        <WalletButton/>

      </div>

    </header>

  )

}
