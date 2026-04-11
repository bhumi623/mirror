import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
function LoginPage() {
    // return <h1>LOGIN PAGE</h1>
    const navigate = useNavigate()
    const [username,setUsername] = useState('')
    const [password,setPassword] = useState('')
    const [error,setError] = useState('')
    const [loading,setLoading] = useState(false)
    const { login } = useAuth()
    const handleLogin = async () => {
        setLoading(true)
        setError('')
        try {
        await login(username, password)
        navigate('/analyze')
        } catch (err) {
        setError('Invalid username or password')
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
