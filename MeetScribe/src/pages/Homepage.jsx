import "./Homepage.css"
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MicIcon,
  UploadCloudIcon,
  FileTextIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  DownloadIcon,
} from '../components/icons'
import { authService } from '../lib/authService'
import Footer from '../components/Footer'
import heroImage from '../assets/hero.png'

const FEATURES = [
  {
    icon: MicIcon,
    title: 'Record in the browser',
    description: 'Capture audio or video of your meeting straight from the dashboard — no extra software needed.',
  },
  {
    icon: UploadCloudIcon,
    title: 'Upload existing files',
    description: 'Already have a recording? Upload audio or video files and transcription starts automatically.',
  },
  {
    icon: UsersIcon,
    title: 'Speaker-labelled transcripts',
    description: 'Transcripts are split by speaker, so you can follow exactly who said what.',
  },
  {
    icon: FileTextIcon,
    title: 'AI meeting summaries',
    description: 'Get a structured summary with key points and action items for every meeting.',
  },
  {
    icon: PencilIcon,
    title: 'Review and edit',
    description: 'Play back the recording alongside the transcript and fine-tune the summary before sharing.',
  },
  {
    icon: DownloadIcon,
    title: 'Copy and export',
    description: 'Copy the transcript or summary in one click, or download everything as a PDF.',
  },
]

const STEPS = [
  { title: 'Record or upload', description: 'Start a recording or drop in a meeting file.' },
  { title: 'We transcribe it', description: 'MeetScribe processes your file and generates a transcript and summary.' },
  { title: 'Review and share', description: 'Read, edit, copy, or export the results from Your Files.' },
]

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

        <section className="features" aria-labelledby="features-heading">
          <div className="section-heading">
            <h2 id="features-heading">Everything you need after a meeting</h2>
            <p>From recording to shareable notes, MeetScribe handles the busywork so you can focus on the conversation.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="feature-card">
                <span className="feature-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-heading">
          <div className="section-heading">
            <h2 id="how-heading">How it works</h2>
          </div>
          <ol className="steps">
            {STEPS.map(({ title, description }, index) => (
              <li key={title} className="step">
                <span className="step-number">{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
          <p className="retention-note">
            <ClockIcon />
            Uploaded recordings are kept for 7 days; transcripts and summaries stay in your account.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
