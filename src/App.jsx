import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"

import Dashboard from "./pages/Dashboard"
import CreateTx from "./pages/CreateTx"
import History from "./pages/History"
import Profile from "./pages/Profile"

export default function App() {

  return (

    <BrowserRouter>

      <Layout>

        <Routes>

          <Route path="/" element={<Dashboard/>} />
          <Route path="/create" element={<CreateTx/>} />
          <Route path="/history" element={<History/>} />
          <Route path="/profile" element={<Profile/>} />

        </Routes>

      </Layout>

    </BrowserRouter>

  )

}