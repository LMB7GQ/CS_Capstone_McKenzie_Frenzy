// API Configuration - centralizes all backend connection settings
// This is where we define the backend URL and default settings

// For now, backend runs on localhost:5000 (server default)
// Change this when deploying to production or set VITE_API_URL in .env
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Default headers for all API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  // We'll add auth headers here later when we implement authentication
}

// API endpoints - keeps all routes in one place for easy reference
export const API_ENDPOINTS = {
  games: {
    getAll: '/games',
    getById: (id: number) => `/games/${id}`,
    create: '/games',
    update: (id: number) => `/games/${id}`,
    delete: (id: number) => `/games/${id}`,
  },
  users: {
    getAll: '/users',
    getById: (id: number) => `/users/${id}`,
    getCurrentUser: '/users/me',
  },
  communities: {
    getAll: '/communities',
    getById: (id: number) => `/communities/${id}`,
  },
}
