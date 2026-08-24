import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { supabase } from '../lib/supabaseClient'
export default function Login() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    navigate('/dashboard')
  } catch (err) {
    setError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-preview">
          <div className="login-preview-heading">
            <h2>Your meetings,<br />already in motion.</h2>
            <p>Capture the conversation, keep the important parts, and turn every discussion into clear next steps.</p>
          </div>
          <div className="preview-window">
            <div className="preview-toolbar">
              <div className="preview-dots"><span></span><span></span><span></span></div>
              <span className="preview-label">MeetScribe dashboard</span>
            </div>
            <div className="preview-record">
              <div className="preview-record-dot"></div>
              <div>
                <strong>Recording meeting audio</strong>
                <span>Live capture · 12:48</span>
              </div>
              <span className="preview-badge">Active</span>
            </div>
            <div className="preview-grid">
              <div className="preview-panel">
                <h3>Upload progress</h3>
                <div className="preview-progress"><span></span></div>
                <div className="preview-stat"><span>Q4 strategy meeting</span><strong>72%</strong></div>
              </div>
              <div className="preview-panel">
                <h3>Recent files</h3>
                <div className="preview-file"><div className="preview-file-icon">A</div><span>Client call.mp3</span></div>
                <div className="preview-file"><div className="preview-file-icon">T</div><span>Team notes.txt</span></div>
              </div>
            </div>
          </div>
        </div>

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
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
    </div>
  )
}