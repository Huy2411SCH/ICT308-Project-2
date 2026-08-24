import "./Homepage.css"
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MicIcon,
  UploadCloudIcon,
  FileTextIcon,
  ClockIcon,
} from '../components/icons'
import { authService } from '../lib/authService'
import Footer from '../components/Footer'
import heroImage from '../assets/hero.png'



export default function Homepage() {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    authService.getSession()
      .then((session) => setIsAuthed(!!session))
      .catch(() => setIsAuthed(false))
  }, [])

  const primaryCtaLink = isAuthed ? '/dashboard' : '/signup'
  const primaryCtaLabel = isAuthed ? 'Go to Dashboard' : 'Get Started Free'

  return (
    <div className="homepage">
      <header className="homepage-header">
        <Link to="/homepage" className="brand">
          <span className="brand-icon">
            <MicIcon />
          </span>
          <span className="brand-name">MeetScribe</span>
        </Link>

        <nav className="homepage-nav">
          {isAuthed ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Turn every meeting into a searchable transcript</h1>
            <p>
              Record, upload, and transcribe meetings in minutes.
            </p>
            <div className="hero-actions">
              <Link to={primaryCtaLink} className="btn btn-primary btn-lg">
                {primaryCtaLabel}
              </Link>
              {!isAuthed && (
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <div className="hero-media">
            <img src={heroImage}  />
          </div>
        </section>



      </main>

      <Footer />
    </div>
  )
}
