import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GameDetails from './pages/GameDetails'
import SearchResults from './pages/SearchResults'
import Library from './pages/Library'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Login from './pages/Login'
import GamesWidget from './components/GamesWidget'

function App() {
  return (
    <BrowserRouter>
      {/* show the games list on every page */}
      <GamesWidget />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/library/:userId" element={<Library />} />
        <Route path="/community/:communityId" element={<Community />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
