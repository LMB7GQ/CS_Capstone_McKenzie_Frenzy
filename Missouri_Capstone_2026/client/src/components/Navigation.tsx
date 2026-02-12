import { Link } from 'react-router-dom'

export default function Navigation(): React.ReactElement {
  return (
    <nav style={{ backgroundColor: '#2c3e50', padding: '12px 20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Game Library</h2>
        <div style={{ display: 'flex', gap: 15, flex: 1 }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Home
          </Link>
          <Link to="/community/1" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Community
          </Link>
          <Link to="/library/1" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Library
          </Link>
          <Link to="/profile/1" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Profile
          </Link>
          <Link to="/search" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Search
          </Link>
          <Link to="/login" style={{ color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#34495e'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
            Login
          </Link>
        </div>
        <div style={{ fontSize: 12, color: '#bdc3c7' }}>
          View different games on each page • Click to navigate
        </div>
      </div>
    </nav>
  )
}
