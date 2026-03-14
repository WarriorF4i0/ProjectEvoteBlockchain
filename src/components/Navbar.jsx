import WalletButton from "./WalletButton"

export default function Navbar(){

  return(

    <div className="flex justify-between p-4 bg-gray-900">

      <h1 className="text-xl">
        Blockchain dApp
      </h1>

      <WalletButton/>

    </div>

  )

}