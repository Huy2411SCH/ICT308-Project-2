import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Import components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages (we'll create these)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Login handler
  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('token', userData.token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // Logout handler
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes - No Layout */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />

        {/* Protected Routes - With Layout */}
        <Route 
          element={<Layout user={user} onLogout={handleLogout} />}
        >
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } 
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

// 404 Component
function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="home-link">Go Home</a>
    </div>
  )
}

export default App