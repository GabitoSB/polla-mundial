import api from './client'

export const getMyPredictions = () => api.get('/predictions/my')
export const createPrediction = (data) => api.post('/predictions/', data)
export const updatePrediction = (id, data) => api.put(`/predictions/${id}`, data)
