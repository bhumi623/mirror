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
     <div className="min-h-screen grid grid-cols-1 md:grid-cols-2"
    style={{fontFamily: 'var(--font-sans)', background: '#F5F0E8'}}>

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
            BE A PART<br />OF US.
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
          <input
            type = "text"
            placeholder = ""
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
          </label>
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
            Email
          <input
            type = "email"
            placeholder = ""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          </label>
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
          <input
            type = "password"
            placeholder = ""
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
          </label>
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
            Name
          <input
            type = "text"
            placeholder = ""
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          </label>
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
            Preferred Language
          <select 
            value={preferredLanguage} 
            onChange={(e) => setPreferredLanguage(e.target.value)}
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d4c3a3',
              backgroundColor: '#fffdf8',
              color: '#5c4a2f',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              outline: 'none',
              width: '100%'
            }}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
          </label>
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
          onClick={handleRegister}
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
          {loading ? 'Creating your mirror...' : 'Create My Mirror →'}
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
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{
              color: '#9B72CF',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign in
          </span>
        </p>

      {/* </div> */}
    </div>

  </div>
  )
}

export default RegisterPage