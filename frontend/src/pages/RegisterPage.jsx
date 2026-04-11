import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async () => {
    console.log('handleRegister called')
    setLoading(true)
    setError('')
    try {
      console.log('trying to register...')
      await api.post('/auth/register/', {
        username,
        email,
        password,
        name,
        preferred_language: preferredLanguage,
      })
      navigate('/login')
    } catch (err){
      console.log('error:', err)
      setError(err.response?.data?.username?.[0] || 'Registration Failed')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div>
            <h1>Register to Mirror</h1>

            <input
                type = "text"
                placeholder = "Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type = "email"
                placeholder = "Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type = "password"
                placeholder = "Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <input
                type = "text"
                placeholder = "Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <select 
                value={preferredLanguage} 
                onChange={(e) => setPreferredLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>

            <button onClick={handleRegister} disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </button>

            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
  )
}

export default RegisterPage