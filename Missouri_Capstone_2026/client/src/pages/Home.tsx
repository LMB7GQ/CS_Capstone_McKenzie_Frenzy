import GamesWidget from '../components/GamesWidget'

export default function Home() {
  return (
    <div>
      <GamesWidget gameId={1} />
      <h1>Home</h1>
      <p>Welcome to the game library</p>
    </div>
  )
}
