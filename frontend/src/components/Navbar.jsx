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
        <nav className="w-full px-8 py-4 bg-white shadow-sm flex items-center justify-between">
            {/*Logo*/}
            <div
                onClick={() => navigate('/')}
                className="cursor-pointer"
            >
                <h1 className="text-2xl font-extrabold text-mirror-purple-dark">
                    Mirror
                </h1>
                <p className="text-xs text-mirror-subtext -mt-1">
                    Know Yourself
                </p>

            </div>
            {/* Right side */}
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <span className="text-mirror-subtext text-sm">
                            Hey, <span className="font-semibold text-mirror-text">
                                {user.name || user.username}
                            </span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-mirror-coral text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-all">
                                Logout
                        </button>
                    </>
                ):(
                    <>
                        <button
                        onClick={() => navigate('/login')}
                        className="text-mirror-purple-dark font-semibold text-sm hover:opacity-70 transition-all"
                        >
                        Login
                        </button>
                        <button
                        onClick={() => navigate('/register')}
                        className="bg-mirror-purple text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-all"
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