import api from './client'

export const getMatches = () => api.get('/matches/')
export const createMatch = (data) => api.post('/matches/', data)
export const deleteMatch = (matchId) => api.delete(`/matches/${matchId}`)
export const updateResult = (matchId, data) => api.put(`/matches/${matchId}/result`, data)
export const updateSchedule = (matchId, data) => api.put(`/matches/${matchId}/schedule`, data)
export const getMatchPredictions = (matchId) => api.get(`/matches/${matchId}/predictions`)
