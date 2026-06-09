import api from './client'

export const register = (data) => api.post('/auth/register', data)

export const login = (username, password) =>
  api.post('/auth/login', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

export const getMe = () => api.get('/auth/me')

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })

export const resetPassword = (token, new_password) =>
  api.post('/auth/reset-password', { token, new_password })

export const uploadAvatar = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/auth/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteAvatar = () => api.delete('/auth/me/avatar')
