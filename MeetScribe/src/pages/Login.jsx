import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { supabase } from '../lib/supabaseClient'
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    onLogin(data.user)
    navigate('/dashboard')
  } catch (err) {
    setError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>MeetScribe</h1>
          <p>AI Transcript & Meeting Notes Generator</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

      </div>
    </div>
  )
}