import { Link } from 'react-router-dom'
import { MicIcon } from './icons'
import './HomeHeader.css'

// Nav bar for the public landing page — just the brand and a sign-in link,
// unlike the authenticated app-header which carries an account menu.
export default function HomeHeader() {
  return (
    <nav className="home-header">
      <span className="brand">
        <span className="brand-icon">
          <MicIcon />
        </span>
        <span className="brand-name">MeetScribe</span>
      </span>
      <Link to="/login" className="btn btn-primary">
        Sign in
      </Link>
    </nav>
  )
}
