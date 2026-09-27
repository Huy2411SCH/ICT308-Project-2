import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'
import { authService } from '../lib/authService'
import LoginHeader from '../components/LoginHeader'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.sendPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <LoginHeader />
      <div className="login-center login-center-padded">
        <div className="login-container">
          <div className="login-header">
            <h1>Forgot password</h1>
            <p>We'll email you a link to choose a new one.</p>
          </div>

          {sent ? (
            // Same message whether or not the address has an account, so the
            // form can't be used to discover who is registered.
            <div className="login-success">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way. Check your inbox.
            </div>
          ) : (
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

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          <p>Remembered it? <Link to="/login">Back to login</Link></p>
        </div>
      </div>
    </div>
  )
}
