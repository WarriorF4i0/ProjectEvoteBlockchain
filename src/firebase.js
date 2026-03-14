import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyBjbwenPZZ-bxLsZrHWo8gqLJtRgqY5b_s",
  authDomain: "blockchain-7701b.firebaseapp.com",
  databaseURL: "https://blockchain-7701b-default-rtdb.firebaseio.com",
  projectId: "blockchain-7701b",
  storageBucket: "blockchain-7701b.firebasestorage.app",
  messagingSenderId: "674042482142",
  appId: "1:674042482142:web:499c620300075b8c28a14f"
}

const app = initializeApp(firebaseConfig)

export const db = getDatabase(app)