import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { authService } from '../lib/authService'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { session } = await authService.signUp(email, password)
      if (session) {
        // Email confirmation is disabled — user is signed in immediately.
        navigate('/dashboard')
      } else {
        // Confirmation email sent — nothing to navigate to yet.
        setSubmitted(true)
      }
    } catch (err) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Check your email</h1>
            <p>We sent a confirmation link to {email}.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>MeetScribe</h1>
          <p>Create your account</p>
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
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  )
}