import axios from 'axios'
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
})
const publicEndpoints = ['/auth/login/', '/auth/register/']
api.interceptors.request.use((config) => {
  const isPublic = publicEndpoints.some(endpoint => 
    config.url.includes(endpoint)
  )
  
  if (!isPublic) {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  
  return config
})
export default api