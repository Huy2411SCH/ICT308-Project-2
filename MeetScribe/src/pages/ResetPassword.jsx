import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { authService } from '../lib/authService'
import LoginHeader from '../components/LoginHeader'

const MIN_PASSWORD_LENGTH = 6 // matches auth.minimum_password_length in supabase/config.toml

// Landing page for the emailed reset link. Supabase exchanges the token in the
// URL for a session on page load; with that session we can set a new password.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // getSession waits for the client to finish reading the link's token.
    authService
      .getSession()
      .then((session) => setHasSession(Boolean(session)))
      .catch(() => setHasSession(false))
      .finally(() => setChecking(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await authService.updatePassword(password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not update password')
      setSaving(false)
    }
  }

  let content
  if (checking) {
    content = <div className="login-success">Checking your reset link...</div>
  } else if (!hasSession) {
    content = (
      <div className="login-error">
        This reset link is invalid or has expired. <Link to="/forgot-password">Request a new one</Link>.
      </div>
    )
  } else {
    content = (
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter the new password"
            autoComplete="new-password"
            required
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    )
  }

  return (
    <div className="login-page">
      <LoginHeader />
      <div className="login-center login-center-padded">
        <div className="login-container">
          <div className="login-header">
            <h1>Reset password</h1>
            <p>Choose a new password for your account.</p>
          </div>
          {content}
        </div>
      </div>
    </div>
  )
}
