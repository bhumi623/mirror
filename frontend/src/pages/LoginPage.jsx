/* LoginPage.jsx */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleAuthButton from '../components/GoogleAuthButton'
import Mascot from '../components/Mascot'
import './RegisterPage.css'

function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const [expression,      setExpression]      = useState('default')
  const [passwordFocused, setPasswordFocused] = useState(false)
  const resetTimer = useRef(null)
  const navigate   = useNavigate()
  const { login, googleLogin } = useAuth()

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

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    triggerExpr('think', 8000)
    try {
      await login(email, password)
      triggerExpr('dizzy', 1200)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError('Invalid email or password.')
      triggerExpr('angry', 2500)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (tokenData) => {
    try {
      await googleLogin(tokenData)
      navigate('/')
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
          <h1 className="m-heading">WELCOME<br />BACK.</h1>
        </div>

        <div className="reg-mascot-area">
          <Mascot expression={expression} passwordFocused={passwordFocused} />
        </div>

        <p className="reg-tagline">KNOW YOURSELF · CHALLENGE YOURSELF</p>
      </div>
      <div className="reg-right">
        <div className="reg-form-wrap">

          <h2 className="reg-form-title">Welcome back.</h2>
          <p className="m-body" style={{ marginBottom: 32 }}>
            Your mirror is waiting.
          </p>

          <div className="m-form-group">
            <label className="m-label" htmlFor="log-email">Email</label>
            <input
              id="log-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={onThinkFocus}
              onBlur={onThinkBlur}
            />
          </div>

          <div className="m-form-group">
            <label className="m-label" htmlFor="log-password">Password</label>
            <input
              id="log-password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={onPasswordFocus}
              onBlur={onPasswordBlur}
              onKeyUp={onPasswordKey}
            />
          </div>

          {error && <p className="m-error-text" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            className="btn-primary btn-full"
            onClick={handleLogin}
            disabled={loading}
            style={{ marginBottom: 16, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Opening your mirror...' : 'Show Me My Mirror →'}
          </button>

          <div className="m-divider">or</div>

          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <p className="m-body" style={{ textAlign: 'center', marginTop: 24 }}>
            New here?{' '}
            <a href="/register" onClick={e => { e.preventDefault(); navigate('/register') }}>
              Create your account
            </a>
          </p>

        </div>
      </div>

    </div>
  )
}

export default LoginPage