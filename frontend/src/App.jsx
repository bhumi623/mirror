import { useState, useEffect } from 'react'
import api from './services/api'
function App() {
  const [message,setMessage] = useState('')
  useEffect(() => {
    api.post('/auth/login/', {
      username: "testuser1",
      password: "securepass123"
    })
    .then(response => {
      setMessage('Login worked! Token: ' + response.data.access.slice(0,20) + '...')
    })
    .catch(error => {
      setMessage('Error: '+ error.message)
    })
  }, [])
  return (
    <div>
      <h1>Mirror</h1>
      <p>{message}</p>
    </div>
  )
}
export default App
