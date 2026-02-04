// Dummy data for testing routing between frontend and backend
// This will be returned by the API until we have a real database

export const dummyGames = [
  {
    id: 1,
    title: 'Elden Ring',
    description: 'A fantasy action RPG by FromSoftware',
    genre: 'RPG',
    platform: 'PC, PlayStation, Xbox',
    rating: 9.0,
    releaseDate: '2022-02-25',
    imageUrl: 'https://via.placeholder.com/300x400?text=Elden+Ring'
  },
  {
    id: 2,
    title: 'Baldur\'s Gate 3',
    description: 'A story-rich RPG based on D&D',
    genre: 'RPG',
    platform: 'PC, PlayStation',
    rating: 9.2,
    releaseDate: '2023-08-03',
    imageUrl: 'https://via.placeholder.com/300x400?text=Baldurs+Gate+3'
  },
  {
    id: 3,
    title: 'Palworld',
    description: 'A monster-catching adventure game',
    genre: 'Adventure',
    platform: 'PC, Xbox',
    rating: 8.5,
    releaseDate: '2024-01-18',
    imageUrl: 'https://via.placeholder.com/300x400?text=Palworld'
  }
]
