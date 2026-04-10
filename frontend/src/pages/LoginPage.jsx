import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
function LoginPage() {
    // return <h1>LOGIN PAGE</h1>
    const navigate = useNavigate()
    const [username,setUsername] = useState('')
    const [password,setPassword] = useState('')
    const [error,setError] = useState('')
    const [loading,setLoading] = useState(false)
    const handleLogin = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/auth/login/', {
                username,
                password
            })
            const token = response.data.access
            const refresh = response.data.refresh
            localStorage.setItem('access_token', token)
            localStorage.setItem('refresh_token', refresh)
            navigate('/analyze')
        } catch (err) {
            setError('ERROR: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1>Login to Mirror</h1>

            <input
                type = "text"
                placeholder = "Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type = "password"
                placeholder = "Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>

            {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
    )


}

export default LoginPage
