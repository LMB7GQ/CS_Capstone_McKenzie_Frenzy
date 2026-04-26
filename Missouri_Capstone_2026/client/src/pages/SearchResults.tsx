import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Game } from '../api/gameAPI'

interface SearchState {
    games: Game[]
    loading: boolean
    error: string | null
}

export default function SearchResults() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const [state, setState] = useState<SearchState>({
        games: [],
        loading: false,
        error: null,
    })

    useEffect(() => {
        if (!query && !category) return

        const fetchResults = async () => {
            setState({ games: [], loading: true, error: null })
            try {
                let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/games?limit=25`
                if (query) {
                    url += `&search=${encodeURIComponent(query)}`
                } else if (category) {
                    url += `&category=${encodeURIComponent(category)}`
                }

                const res = await fetch(url)
                const json = await res.json()
                setState({
                    games: json.data || [],
                    loading: false,
                    error: json.success === false ? 'Failed to fetch results' : null,
                })
            } catch (err) {
                setState({
                    games: [],
                    loading: false,
                    error: 'Failed to fetch results',
                })
            }
        }

        fetchResults()
    }, [query, category])

    const displayTitle = query ? 'Search Results' : `${category?.replace(/_/g, ' ')} Games`
    const displaySubtitle = query ? `"${query}"` : `Browse all ${category?.replace(/_/g, ' ').toLowerCase()} games`

    return (
        <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '62px 28px 40px 28px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '2rem', fontWeight: 800,
                    color: '#e8f5e9', fontFamily: "'Exo 2', sans-serif",
                    marginBottom: '8px',
                    lineHeight: 1.2,
                }}>
                    {displayTitle}
                </h1>
                <p style={{
                    fontSize: '1rem', color: '#7a9e82',
                    fontFamily: "'DM Sans', sans-serif",
                    margin: '0 0 16px 0',
                }}>
                    Found <span style={{ color: '#4ade80', fontWeight: 600 }}>{state.games.length}</span> result{state.games.length !== 1 ? 's' : ''} for {displaySubtitle}
                </p>
            </div>

            {state.loading && (
                <p style={{ color: '#7a9e82', fontSize: '1rem' }}>Loading...</p>
            )}

            {state.error && (
                <p style={{ color: '#ff6b6b', fontSize: '1rem' }}>{state.error}</p>
            )}

            {!state.loading && state.games.length === 0 && (
                <p style={{ color: '#7a9e82', fontSize: '1rem' }}>No results found.</p>
            )}

            {!state.loading && state.games.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '24px',
                }}>
                    {state.games.map((game) => (
                        <a
                            key={game._id}
                            href={`/games/${game.rawgId}`}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#172011',
                                border: '1px solid #2a4030',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#4ade80'
                                e.currentTarget.style.boxShadow = '0 0 12px rgba(74,222,128,0.2)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#2a4030'
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'none'
                            }}
                        >
                            {game.backgroundImage && (
                                <img
                                    src={game.backgroundImage}
                                    alt={game.name}
                                    style={{
                                        width: '100%',
                                        height: '120px',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}
                            <div style={{ padding: '12px' }}>
                                <h3 style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    marginBottom: '8px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: '#e8f5e9',
                                }}>
                                    {game.name}
                                </h3>
                                {game.rating && (
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: '#4ade80',
                                        margin: 0,
                                    }}>
                                        ★ {game.rating.toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </main>
    )
}
