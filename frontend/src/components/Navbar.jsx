import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
        background: '#F5F0E8',
        borderBottom: '1px solid rgba(26,16,0,0.08)',
        padding: '20px 52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }}>
        <div
        onClick={() => navigate('/')}
        style={{cursor: 'pointer'}}
        >
        <div style={{fontSize: '16px', fontWeight: '700', letterSpacing: '2px', color: '#1a1000', textTransform: 'uppercase'}}>Mirror</div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
        {user ? (
            <>
            <span style={{fontSize: '13px', color: '#8B7355'}}>
                Hey, <span style={{fontWeight: '700', color: '#1a1000'}}>{user.name || user.username}</span>
            </span>
            <button
                onClick={handleLogout}
                style={{background: 'transparent', color: '#1a1000', padding: '10px 20px', border: '1.5px solid #1a1000', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer'}}
            >
                Logout
            </button>
            </>
        ) : (
            <>
            <span
                onClick={() => navigate('/login')}
                style={{fontSize: '11px', fontWeight: '700', color: '#1a1000', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer'}}
            >
                Login
            </span>
            <button
                onClick={() => navigate('/register')}
                style={{background: '#D4AF37', color: '#1a1000', padding: '10px 20px', border: 'none', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer'}}
            >
                Register
            </button>
            </>
        )}
        </div>
    </nav>
    )
}

export default Navbar