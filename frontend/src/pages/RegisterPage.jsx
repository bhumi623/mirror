/* RegisterPage.jsx */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Mascot from '../components/Mascot.jsx'
import GoogleAuthButton from '../components/GoogleAuthButton.jsx'
import { useAuth } from '../context/AuthContext'
import './RegisterPage.css'

function RegisterPage() {
  const [email,             setEmail]             = useState('')
  const [password,          setPassword]          = useState('')
  const [name,              setName]              = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [error,             setError]             = useState('')
  const [loading,           setLoading]           = useState(false)

  const [expression,      setExpression]      = useState('default')
  const [passwordFocused, setPasswordFocused] = useState(false)
  const resetTimer = useRef(null)
  const navigate   = useNavigate()
  const { googleLogin } = useAuth()

  const triggerExpr = (expr, ms = 2000) => {
    clearTimeout(resetTimer.current)
    setExpression(expr)
    resetTimer.current = setTimeout(() => setExpression('default'), ms)
  }

  const onPasswordFocus = () => {
    setPasswordFocused(true)
    if (expression === 'default') setExpression('closed')
  }
  const onPasswordBlur = () => {
    setPasswordFocused(false)
    if (expression === 'closed' || expression === 'peek') setExpression('default')
  }
  const onPasswordKey = (e) => {
    const caps = e.getModifierState('CapsLock')
    if (caps && (expression === 'closed' || expression === 'default')) {
      setExpression('peek')
    } else if (!caps && expression === 'peek') {
      setExpression(document.activeElement === e.target ? 'closed' : 'default')
    }
  }

  const onThinkFocus = () => { if (expression === 'default') setExpression('think') }
  const onThinkBlur  = () => { if (expression === 'think')   setExpression('default') }

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    triggerExpr('think', 8000)
    try {
      await api.post('/auth/register/', {
        email,
        password,
        name,
        preferred_language: preferredLanguage,
      })
      triggerExpr('dizzy', 1200)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.password?.[0] || 'Registration failed. Try again.'
      setError(msg)
      triggerExpr('angry', 2500)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (tokenData) => {
    try {
      await googleLogin(tokenData)
      navigate('/analyze')
    } catch (err) {
      setError('Google login failed. Please try again.')
    }
  }

  const handleGoogleError = (message) => {
    setError(message)
  }

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  return (
    <div className="reg-root">
      <div className="reg-left">
        <div className="reg-logo" onClick={() => navigate('/')}>Mirror</div>
        <div className="reg-brand">
          <div className="m-line" />
          <h1 className="m-heading">BE A PART<br />OF US.</h1>
        </div>
        <div className="reg-mascot-area">
          <Mascot expression={expression} passwordFocused={passwordFocused} />
        </div>
        <p className="reg-tagline">KNOW YOURSELF · CHALLENGE YOURSELF</p>
      </div>
      <div className="reg-right">
        <div className="reg-form-wrap">
          <h2 className="reg-form-title">Create your mirror</h2>
          <p className="m-body" style={{ marginBottom: 32 }}>
            Join others discovering themselves.
          </p>
          <div className="m-form-group">
            <label className="m-label" htmlFor="reg-name">Your Name</label>
            <input
              id="reg-name" type="text"
              placeholder="What should Mirror call you?"
              value={name} onChange={e => setName(e.target.value)}
              onFocus={onThinkFocus} onBlur={onThinkBlur}
            />
          </div>
          <div className="m-form-group">
            <label className="m-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email" type="email"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={onThinkFocus} onBlur={onThinkBlur}
            />
          </div>

          <div className="m-form-group">
            <label className="m-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password" type="password"
              placeholder="Min. 8 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={onPasswordFocus} onBlur={onPasswordBlur} onKeyUp={onPasswordKey}
            />
          </div>
          <div className="m-form-group">
            <label className="m-label" htmlFor="reg-lang">I write in</label>
            <select
              id="reg-lang"
              value={preferredLanguage}
              onChange={e => setPreferredLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              {/* <option value="hinglish">Hinglish</option> */}
            </select>
          </div>

          {error && <p className="m-error-text" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            className="btn-primary btn-full"
            onClick={handleRegister}
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            {loading ? 'Creating your mirror...' : 'Create My Mirror →'}
          </button>

          <div className="m-divider">or</div>

          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
          <p className="m-body" style={{ textAlign: 'center', marginTop: 24 }}>
            Already have an account?{' '}
            <a href="/login" onClick={e => { e.preventDefault(); navigate('/login') }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
export default RegisterPage