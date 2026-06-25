import api from './client'

export const getLeaderboard = () => api.get('/leaderboard/')

export const getLeaderboardHistory = () => api.get('/leaderboard/history')
