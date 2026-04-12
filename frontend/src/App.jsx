// import { useState, useEffect } from 'react'
// import api from './services/api'
// function App() {
//   const [message,setMessage] = useState('')
//   useEffect(() => {
//     api.post('/auth/login/', {
//       username: "testuser1",
//       password: "securepass123"
//     })
//     .then(response => {
//       setMessage('Login worked! Token: ' + response.data.access.slice(0,20) + '...')
//     })
//     .catch(error => {
//       setMessage('Error: '+ error.message)
//     })
//   }, [])
//   return (
//     <div>
//       <h1>Mirror</h1>
//       <p>{message}</p>
//     </div>
//   )
// }
// export default App
import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage' 
import RegisterPage from './pages/RegisterPage' 
import AnalyzePage from './pages/AnalyzePage'
import ProtectedRoute from './components/ProtectedRoute'
function App() {
  return (
    <div className="bg-mirror-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/login" element = {<LoginPage/>}/>
        <Route path="/register" element = {<RegisterPage/>}/>    
        <Route path="/analyze" element={
          <ProtectedRoute>
            <AnalyzePage/>
          </ProtectedRoute>
          }/>
      </Routes>
    </div>
    // <div className="bg-mirror-bg min-h-screen p-8">
    //   <h1 className="text-3xl font-bold text-mirror-text">Mirror</h1>
    //   <p className="text-mirror-subtext">Know Yourself. Challenge Yourself</p>
    // </div>
  )
}
export default App