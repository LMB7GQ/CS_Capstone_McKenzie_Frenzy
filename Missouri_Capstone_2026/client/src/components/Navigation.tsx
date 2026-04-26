import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface GameSuggestion {
    _id: string
    rawgId: number
    name: string
    backgroundImage?: string
}

export default function Navigation() {
    const [query, setQuery] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Fetch suggestions as user types
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 1) {
                setSuggestions([])
                setShowSuggestions(false)
                return
            }

            setIsLoading(true)
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/games?search=${encodeURIComponent(query)}&limit=5`
                )
                const json = await res.json()
                setSuggestions(json.data || [])
                setShowSuggestions(true)
            } catch (err) {
                console.error('Failed to fetch suggestions:', err)
                setSuggestions([])
            } finally {
                setIsLoading(false)
            }
        }, 300) // Debounce 300ms

        return () => clearTimeout(timer)
    }, [query])

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = query.trim()
        if (!trimmed) return
        navigate(`/search?q=${encodeURIComponent(trimmed)}`)
        setQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        inputRef.current?.blur()
    }

    function handleSuggestionClick(game: GameSuggestion) {
        navigate(`/games/${game.rawgId}`)
        setQuery('')
        setSuggestions([])
        setShowSuggestions(false)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            setQuery('')
            setSuggestions([])
            setShowSuggestions(false)
            inputRef.current?.blur()
        }
    }

    const NAV_LINKS = [
        { label: 'Home', to: '/' },
        { label: 'Community', to: '/community/1' },
        { label: 'Library', to: '/library/1' },
        { label: 'Profile', to: '/profile/1' },
    ]

    return (
        <>
            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: '62px',
                zIndex: 1000,
                backgroundColor: 'rgba(8, 13, 10, 0.95)',
                backdropFilter: 'blur(14px)',
                borderBottom: '1px solid #1e2e20',
                boxShadow: '0 1px 24px rgba(0,0,0,0.5)',
            }}>
                <nav style={{
                    maxWidth: '1440px',
                    margin: '0 auto',
                    height: '100%',
                    padding: '0 28px',
                    display: 'flex',
                    alignItems: 'center',
                }}>

                    {/* Logo */}
                    <Link to="/" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginRight: '32px', textDecoration: 'none', flexShrink: 0,
                    }}>
                        <span style={{ fontSize: '1.4rem', color: '#4ade80' }}>⬡</span>
                        <span style={{
                            fontFamily: "'Exo 2', sans-serif", fontSize: '1.2rem',
                            fontWeight: 800, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#e8f5e9',
                        }}>
                            NEXUS<span style={{ color: '#4ade80' }}>GG</span>
                        </span>
                    </Link>

                    {/* Nav Links */}
                    <ul style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', margin: 0, padding: 0 }}>
                        {NAV_LINKS.map((link) => (
                            <li key={link.to}>
                                <Link
                                    to={link.to}
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        fontFamily: "'Exo 2', sans-serif",
                                        fontSize: '0.8rem', fontWeight: 600,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        color: '#c8deca', padding: '6px 14px',
                                        borderRadius: '4px', border: '1px solid transparent',
                                        textDecoration: 'none', display: 'block',
                                        transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.color = '#4ade80'
                                        e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)'
                                        e.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.color = '#c8deca'
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                        e.currentTarget.style.borderColor = 'transparent'
                                    }}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ flexShrink: 0, position: 'relative' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            backgroundColor: '#172011', border: '1px solid #2a4030',
                            borderRadius: '8px', overflow: 'hidden',
                            height: '38px', width: '240px',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, width 0.2s ease',
                        }}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search games..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={e => {
                                    const p = e.currentTarget.parentElement
                                    if (p) { p.style.borderColor = '#22c55e'; p.style.boxShadow = '0 0 0 2px rgba(74,222,128,0.18)'; p.style.width = '300px' }
                                    if (query.trim().length >= 2) setShowSuggestions(true)
                                }}
                                onBlur={e => {
                                    const p = e.currentTarget.parentElement
                                    if (p) { p.style.borderColor = '#2a4030'; p.style.boxShadow = 'none'; p.style.width = '240px' }
                                }}
                                aria-label="Search games"
                                style={{
                                    flex: 1, background: 'none', border: 'none', outline: 'none',
                                    color: '#e8f5e9', fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '0.875rem', padding: '0 14px', height: '100%', minWidth: 0,
                                }}
                            />
                            <button type="submit" aria-label="Submit search"
                                style={{
                                    padding: '0 12px', height: '100%', color: '#3d5c44',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                                onMouseLeave={e => e.currentTarget.style.color = '#3d5c44'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </button>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (suggestions.length > 0 || isLoading) && (
                            <div
                                ref={suggestionsRef}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#172011',
                                    border: '1px solid #2a4030',
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    zIndex: 1001,
                                    marginTop: '-1px',
                                }}
                            >
                                {isLoading ? (
                                    <div style={{
                                        padding: '12px 14px',
                                        color: '#7a9e82',
                                        fontSize: '0.875rem',
                                    }}>
                                        Loading...
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div style={{
                                        padding: '12px 14px',
                                        color: '#7a9e82',
                                        fontSize: '0.875rem',
                                    }}>
                                        No results found
                                    </div>
                                ) : (
                                    suggestions.map((game) => (
                                        <button
                                            key={game._id}
                                            type="button"
                                            onClick={() => handleSuggestionClick(game)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                color: '#c8deca',
                                                fontSize: '0.875rem',
                                                textAlign: 'left',
                                                transition: 'background-color 0.15s ease',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.1)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                            }}
                                        >
                                            {game.backgroundImage && (
                                                <img
                                                    src={game.backgroundImage}
                                                    alt={game.name}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '4px',
                                                        objectFit: 'cover',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {game.name}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </form>

                    {/* Login */}
                    <Link to="/login"
                        style={{
                            flexShrink: 0, marginLeft: '12px',
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: '0.8rem', fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: '#0a0f0d', backgroundColor: '#4ade80',
                            padding: '0 20px', height: '38px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center',
                            textDecoration: 'none', whiteSpace: 'nowrap',
                            transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#86efac'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4ade80'}
                    >
                        Login
                    </Link>

                </nav>
            </header>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div style={{
                    position: 'fixed', top: '62px', left: 0, right: 0,
                    backgroundColor: 'rgba(8,13,10,0.97)',
                    borderBottom: '1px solid #1e2e20', zIndex: 999,
                }}>
                    <ul style={{ listStyle: 'none', padding: '12px 0', margin: 0 }}>
                        {NAV_LINKS.map((link) => (
                            <li key={link.to}>
                                <Link to={link.to} onClick={() => setMenuOpen(false)}
                                    style={{
                                        display: 'block', fontFamily: "'Exo 2', sans-serif",
                                        fontSize: '0.85rem', fontWeight: 600,
                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                        color: '#c8deca', padding: '12px 28px', textDecoration: 'none',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    )
}