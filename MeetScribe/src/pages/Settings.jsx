import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorBanner from '../components/ErrorBanner'
import { authService } from '../lib/authService'
import './Settings.css'

const MIN_PASSWORD_LENGTH = 6 // matches auth.minimum_password_length in supabase/config.toml

function ChangePasswordForm({ email }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current one')
      return
    }

    setSaving(true)
    try {
      await authService.changePassword(email, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label className="settings-field">
        Current password
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="settings-field">
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="settings-field">
        Confirm new password
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <ErrorBanner message={error} onClose={() => setError(null)} />
      {success && <p className="settings-success">Your password has been changed.</p>}

      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  )
}

export default function Settings({ user }) {
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await authService.deleteAccount()
      navigate('/homepage', { replace: true })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      <p className="settings-subtitle">Signed in as {user?.email}</p>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Change password</h2>
          <p className="card-subtitle">Enter your current password, then choose a new one.</p>
        </div>
        <div className="card-body">
          <ChangePasswordForm email={user?.email} />
        </div>
      </section>

      <section className="card danger-zone">
        <div className="card-header">
          <h2 className="card-title">Delete account</h2>
          <p className="card-subtitle">
            This permanently deletes your account, all your recordings, transcripts and summaries. It cannot be undone.
          </p>
        </div>
        <div className="card-body settings-form">
          <label className="settings-field">
            <span>Type <strong>DELETE</strong> to confirm</span>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          </label>
          <ErrorBanner message={error} onClose={() => setError(null)} />
          <div>
            <button
              className="btn btn-danger"
              disabled={confirmText !== 'DELETE' || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
