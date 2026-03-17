import { BrowserRouter, Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"
import { ToasterProvider } from "./components/Toaster"
import RequireWallet from "./routes/RequireWallet"

import Dashboard from "./pages/Dashboard"
import CreateTx from "./pages/CreateTx"
import History from "./pages/History"
import Profile from "./pages/Profile"
import Vote from "./pages/Vote"
import Multisig from "./pages/Multisig"


export default function App() {

  return (

    <ToasterProvider>
      <BrowserRouter>

        <Layout>

          <Routes>

            <Route path="/" element={
              <RequireWallet>
                <Dashboard/>
              </RequireWallet>
            } />
            <Route path="/dashboard" element={
              <RequireWallet>
                <Dashboard/>
              </RequireWallet>
            } />

            <Route path="/create" element={
              <RequireWallet>
                <CreateTx/>
              </RequireWallet>
            } />
            <Route path="/history" element={
              <RequireWallet>
                <History/>
              </RequireWallet>
            } />
            <Route path="/profile" element={<Profile/>} />
            <Route path="/vote" element={
              <RequireWallet>
                <Vote/>
              </RequireWallet>
            } />
            <Route path="/multisig" element={
              <RequireWallet>
                <Multisig/>
              </RequireWallet>
            } />

          </Routes>

        </Layout>

      </BrowserRouter>
    </ToasterProvider>

  )

}