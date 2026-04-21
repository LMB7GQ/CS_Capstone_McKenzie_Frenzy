import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Game } from '../api/gameAPI'

interface CategoryBrowserProps {
  byCategory: Record<string, Game[]>
}

export default function CategoryBrowser({ byCategory }: CategoryBrowserProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const categories = Object.keys(byCategory)

  function scrollLeft() {
    // 4 cards * 264px + 3 gaps * 16px = 1056 + 48 = 1104px per page
    scrollRef.current?.scrollBy({ left: -1104, behavior: 'smooth' })
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 1104, behavior: 'smooth' })
  }

  if (!categories.length) return null

  return (
    <section style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
    }}>

      {/* Section header */}
      <h2 style={{
        fontFamily: "'Exo 2', sans-serif",
        fontSize: '1.1rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#e8f5e9',
        margin: '0 0 16px 0',
      }}>
        Browse by Category
      </h2>

      {/* Track wrapper with overlapping arrows */}
      <div style={{ position: 'relative' }}>

        {/* Left arrow */}
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          style={{
            position: 'absolute',
            left: '-18px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '36px', height: '36px',
            borderRadius: '50%',
            backgroundColor: '#111a14',
            border: '1px solid #2a4030',
            color: '#c8deca',
            fontSize: '1.3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#4ade80'
            e.currentTarget.style.color = '#0a0f0d'
            e.currentTarget.style.borderColor = '#4ade80'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#111a14'
            e.currentTarget.style.color = '#c8deca'
            e.currentTarget.style.borderColor = '#2a4030'
          }}
        >
          ‹
        </button>

        {/* Right arrow */}
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          style={{
            position: 'absolute',
            right: '-18px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '36px', height: '36px',
            borderRadius: '50%',
            backgroundColor: '#111a14',
            border: '1px solid #2a4030',
            color: '#c8deca',
            fontSize: '1.3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#4ade80'
            e.currentTarget.style.color = '#0a0f0d'
            e.currentTarget.style.borderColor = '#4ade80'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#111a14'
            e.currentTarget.style.color = '#c8deca'
            e.currentTarget.style.borderColor = '#2a4030'
          }}
        >
          ›
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '4px',
            scrollSnapType: 'x mandatory',
          }}
        >
          {categories.map((cat) => {
            const games = byCategory[cat] ?? []
            const coverImage = games[0]?.backgroundImage
            return (
              <CategoryCard
                key={cat}
                category={cat}
                coverImage={coverImage}
                onClick={() => navigate(`/search?category=${cat}`)}
              />
            )
          })}
        </div>

      </div>
    </section>
  )
}

interface CategoryCardProps {
  category: string
  coverImage?: string
  onClick: () => void
}

function CategoryCard({ category, coverImage, onClick }: CategoryCardProps) {
  const label = category.replace(/_/g, ' ')

  // 4 cards visible: 1200px - 48px padding - 18px*2 arrows - 3*16px gaps = 1068px / 4 = 267px
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: '264px',
        height: '148px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #1e2e20',
        cursor: 'pointer',
        padding: 0,
        backgroundColor: '#111a14',
        scrollSnapAlign: 'start',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.borderColor = '#4ade80'
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(74,222,128,0.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#1e2e20'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Background image */}
      {coverImage && (
        <img
          src={coverImage}
          alt={label}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.5,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(10,15,13,0.92) 0%, rgba(10,15,13,0.3) 100%)',
      }} />

      {/* Category name bubble */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px',
      }}>
        <span style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '0.9rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#e8f5e9',
          backgroundColor: 'rgba(10,15,13,0.7)',
          border: '1px solid #2a4030',
          padding: '6px 16px',
          borderRadius: '4px',
          textAlign: 'center',
          backdropFilter: 'blur(6px)',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      </div>

    </button>
  )
}