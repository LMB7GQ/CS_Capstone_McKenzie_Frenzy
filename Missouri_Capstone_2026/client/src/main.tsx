import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getHomePageData } from './api/gameAPI'

console.log("main.tsx is running")

getHomePageData()
  .then((data) => {
    console.log("TOP RATED COUNT:", data.topRated.length)
    console.log("FIRST GAME:", data.topRated[0])
    console.log("CATEGORIES:", Object.keys(data.byCategory))
  })
  .catch((err) => {
    console.error("API ERROR:", err)
  })



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)