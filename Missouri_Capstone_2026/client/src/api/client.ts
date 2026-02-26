// API Client - handles all HTTP requests to the backend
// This is the core communication layer between frontend and backend

import { API_BASE_URL, DEFAULT_HEADERS } from './config'

// Generic fetch function that all requests go through
// This centralizes error handling, headers, and response processing
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  })

  // If response isn't ok (status 200-299), throw error
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  // Parse JSON response and return it
  const data: T = await response.json()
  return data
}

// GET request - fetches data from backend
export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
  })
}

// POST request - sends data to backend (create new resource)
export function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// PUT request - updates existing resource on backend
export function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

// DELETE request - removes resource from backend
export function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  })
}
