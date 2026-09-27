import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorBanner from '../components/ErrorBanner'
import { authService } from '../lib/authService'

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
      <h1>Settings</h1>
      <p>Signed in as {user?.email}</p>

      <section className="danger-zone">
        <h2>Delete account</h2>
        <p>This permanently deletes your account, all your recordings, transcripts and summaries. It cannot be undone.</p>
        <label>
          Type <strong>DELETE</strong> to confirm
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </label>
        {error && <ErrorBanner message={error} />}
        <button
          className="btn btn-danger"
          disabled={confirmText !== 'DELETE' || deleting}
          onClick={handleDelete}
        >
          {deleting ? 'Deleting…' : 'Delete my account'}
        </button>
      </section>
    </div>
  )
}