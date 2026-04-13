import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2"
    style={{fontFamily: 'var(--font-sans)', background: '#F5F0E8'}}>

      {/* Left — Brand side */}
      <div style={{
        padding: '52px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          letterSpacing: '2px',
          color: '#1a1000',
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}
          onClick={() => navigate('/')}
        >
          Mirror
        </div>

        <div>
          <div style={{
            width: '36px',
            height: '3px',
            background: '#D4AF37',
            marginBottom: '20px'
          }} />
          <div style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: '900',
            color: '#1a1000',
            lineHeight: '0.9',
            letterSpacing: '-2px'
          }}>
            WELCOME<br />BACK.
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '300',
            color: '#5a4a2a',
            fontStyle: 'italic',
            marginTop: '12px'
          }}>
            Your mirror is waiting.
          </div>
          <p style={{
            fontSize: '13px',
            color: '#8B7355',
            lineHeight: '1.7',
            marginTop: '20px',
            maxWidth: '280px'
          }}>
            Every word you write tells a story about who you are. Let's read it together.
          </p>
        </div>

        <div style={{
          fontSize: '11px',
          color: '#8B7355',
          letterSpacing: '1px'
        }}>
          KNOW YOURSELF · CHALLENGE YOURSELF
        </div>
      </div>

      {/* Right — Form side */}
      <div style={{
        background: 'white',
        padding: '52px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '24px'
      }}>

        <div>
          <label style={{
            fontSize: '10px',
            fontWeight: '700',
            color: '#8B7355',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px'
          }}>
            Username
          </label>
          <input
            type="text"
            placeholder=""
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 0',
              border: 'none',
              borderBottom: '2px solid #1a1000',
              background: 'transparent',
              fontSize: '15px',
              color: '#1a1000',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{
            fontSize: '10px',
            fontWeight: '700',
            color: '#8B7355',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px'
          }}>
            Password
          </label>
          <input
            type="password"
            placeholder=""
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 0',
              border: 'none',
              borderBottom: '2px solid #1a1000',
              background: 'transparent',
              fontSize: '15px',
              color: '#1a1000',
              outline: 'none'
            }}
          />
        </div>

        {error && (
          <p style={{
            fontSize: '12px',
            color: '#c0392b',
            margin: '0'
          }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            background: '#D4AF37',
            color: '#1a1000',
            padding: '16px',
            border: 'none',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginTop: '8px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Opening your mirror...' : 'Show Me My Mirror →'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{flex: 1, height: '1px', background: '#e8e0d0'}} />
          <span style={{fontSize: '11px', color: '#8B7355'}}>or</span>
          <div style={{flex: 1, height: '1px', background: '#e8e0d0'}} />
        </div>

        <button style={{
          background: 'transparent',
          color: '#1a1000',
          padding: '14px',
          border: '1.5px solid #1a1000',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: 'pointer'
        }}>
          Continue with Google
        </button>

        <p style={{
          fontSize: '12px',
          color: '#8B7355',
          textAlign: 'center',
          margin: '0'
        }}>
          New here?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{
              color: '#9B72CF',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Create your account
          </span>
        </p>

      </div>
    </div>
  )
}

export default LoginPage