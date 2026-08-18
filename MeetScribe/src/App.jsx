import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { authService } from './lib/authService'

// Import components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Signup from './pages/Signup'
function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get current session, then listen for auth changes
  useEffect(() => {
    authService.getSession().then((session) => {
      setSession(session)
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    const subscription = authService.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  // Logout handler
  const handleLogout = async () => {
    try {
      await authService.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
            session ? <Navigate to="/dashboard" /> : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            session ? <Navigate to="/dashboard" /> : <Signup />
          }
        />
        {/* Protected Routes - With Layout */}
        <Route
          element={<Layout session={session} onLogout={handleLogout} />}
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session}>
                <Dashboard user={session?.user} />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
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