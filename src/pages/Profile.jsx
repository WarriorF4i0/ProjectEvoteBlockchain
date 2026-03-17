import { useState, useEffect } from "react"
import { db } from "../firebase"
import { ref, get, update } from "firebase/database"
import { useNavigate } from "react-router-dom"

export default function Profile(){

  const navigate = useNavigate()

  const [wallet,setWallet] = useState(
    localStorage.getItem("wallet")
  )

  const [avatar,setAvatar] = useState(
    localStorage.getItem("avatar")
  )

  const [name,setName] = useState("")
  const [age,setAge] = useState("")

  const [loading,setLoading] = useState(true)


  useEffect(()=>{

    async function loadProfile(){

      const w = localStorage.getItem("wallet")

      if(!w){
        navigate("/")
        return
      }

      setWallet(w)

      const userRef = ref(db,"users/"+w)

      const snapshot = await get(userRef)

      if(snapshot.exists()){

        const data = snapshot.val()

        if(data.avatar){
          setAvatar(data.avatar)
          localStorage.setItem("avatar",data.avatar)
        }

        if(data.name) setName(data.name)
        if(data.age) setAge(data.age)

      }

      setLoading(false)

    }

    loadProfile()

  },[])


  async function uploadAvatar(e){

    const file = e.target.files[0]

    if(!file) return

    const reader = new FileReader()

    reader.onload = async function(){

      const img = reader.result

      setAvatar(img)

      localStorage.setItem("avatar",img)

      const userRef = ref(db,"users/"+wallet)

      await update(userRef,{
        avatar: img
      })

      window.dispatchEvent(new Event("avatarUpdated"))

    }

    reader.readAsDataURL(file)

  }


  async function saveProfile(){

    if(!name || !age){

      alert("Name and age are required")

      return

    }

    const userRef = ref(db,"users/"+wallet)

    await update(userRef,{
      name,
      age
    })

    alert("Profile completed")

    navigate("/dashboard")

  }


  if(loading){
    return <p>Loading...</p>
  }


  return(

    <div className="w-full max-w-xl">

      <h1 className="text-3xl font-bold mb-2">
        Complete Your Profile
      </h1>

      <p className="text-slate-400 mb-6">
        Add a name and avatar to personalize your wallet.
      </p>

      <div className="card">
        <div className="card-inner">

        <div className="flex items-center gap-4 mb-6">

          <img
            src={avatar || "/avatar-default.png"}
            className="w-20 h-20 rounded-full ring-2 ring-slate-800 object-cover"
          />

          <input
            type="file"
            onChange={uploadAvatar}
            className="text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
          />

        </div>

        <div className="mb-4">

          <p className="label mb-2">Name</p>

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="input"
          />

        </div>

        <div className="mb-4">

          <p className="label mb-2">Age</p>

          <input
            value={age}
            onChange={(e)=>setAge(e.target.value)}
            className="input"
          />

        </div>

        <button
          onClick={saveProfile}
          className="btn-primary"
        >
          Save Profile
        </button>

        <div className="mt-6">

          <p className="text-gray-400">
            Wallet Address
          </p>

          <p className="break-all font-mono text-slate-200">
            {wallet}
          </p>

        </div>

      </div>
      </div>

    </div>

  )

}