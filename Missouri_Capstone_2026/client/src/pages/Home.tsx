import { useState, useEffect } from 'react'
import { getHomePageData } from '../api/gameAPI'
import type { HomePageData } from '../api/gameAPI'
import HeroCarousel from '../components/HeroCarousel'
import CategoryBrowser from '../components/CategoryBrowser'
import CategoryBanner from '../components/CategoryBanner'

export default function Home() {
  const [data, setData] = useState<HomePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHomePageData()
      .then((d) => { setData(d); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '20px',
        backgroundColor: '#0a0f0d',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '3px solid #1e2e20',
          borderTopColor: '#4ade80',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '0.8rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#3d5c44',
        }}>
          Loading...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        backgroundColor: '#0a0f0d', color: '#7a9e82', textAlign: 'center', padding: '24px',
      }}>
        <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '1.5rem', color: '#e8f5e9' }}>
          Something went wrong
        </h2>
        <p>{error ?? 'No data available'}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px', fontFamily: "'Exo 2', sans-serif",
            fontSize: '0.85rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#0a0f0d', backgroundColor: '#4ade80',
            padding: '10px 28px', borderRadius: '4px',
            border: 'none', cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const categories = Object.keys(data.byCategory)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0f0d', paddingBottom: '80px' }}>

      {/* Section 1 — Hero Carousel */}
      <HeroCarousel games={data.topRated} />

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#1e2e20', maxWidth: '1200px', margin: '0 auto' }} />

      {/* Section 2 — Browse by Category */}
      <CategoryBrowser byCategory={data.byCategory} />

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#1e2e20', maxWidth: '1200px', margin: '0 auto' }} />

      {/* Section 3 — Top Rated placeholder */}
      <div style={{
        maxWidth: '1200px', margin: '32px auto',
        padding: '0 24px',
      }}>
        <div style={{
          height: '200px',
          backgroundColor: '#111a14',
          border: '1px solid #1e2e20',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#3d5c44',
          }}>
            Top Rated / Popular / Trending — Coming Soon
          </span>
        </div>
      </div>

      {/* Section 4 — Category Banners, one per category */}
      {/* Each banner separated by a recommendations placeholder */}
      {categories.map((cat, i) => (
        <div key={cat}>

          {/* Category Banner */}
          <CategoryBanner
            category={cat}
            games={data.byCategory[cat] ?? []}
          />

          {/* Recommendations placeholder between banners */}
          {i < categories.length - 1 && (
            <div style={{
              maxWidth: '1200px', margin: '0 auto',
              padding: '0 24px 32px',
            }}>
              <div style={{
                height: '160px',
                backgroundColor: '#111a14',
                border: '1px solid #1e2e20',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#3d5c44',
                }}>
                  Recommendations — Coming Soon
                </span>
              </div>
            </div>
          )}

        </div>
      ))}

    </main>
  )
}