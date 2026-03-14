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

    <div className="max-w-xl">

      <h1 className="text-2xl font-bold mb-6">
        Complete Your Profile
      </h1>

      <div className="bg-gray-900 p-6 rounded-xl">

        <div className="flex items-center gap-4 mb-6">

          <img
            src={avatar || "/avatar-default.png"}
            className="w-20 h-20 rounded-full"
          />

          <input
            type="file"
            onChange={uploadAvatar}
          />

        </div>

        <div className="mb-4">

          <p>Name</p>

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full p-2 text-black rounded"
          />

        </div>

        <div className="mb-4">

          <p>Age</p>

          <input
            value={age}
            onChange={(e)=>setAge(e.target.value)}
            className="w-full p-2 text-black rounded"
          />

        </div>

        <button
          onClick={saveProfile}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Save Profile
        </button>

        <div className="mt-6">

          <p className="text-gray-400">
            Wallet Address
          </p>

          <p className="break-all">
            {wallet}
          </p>

        </div>

      </div>

    </div>

  )

}