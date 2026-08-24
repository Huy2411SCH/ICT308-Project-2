import { Link } from 'react-router-dom'
import { MicIcon } from './icons'
import './Header.css'

export default function LoginHeader() {
  return (
    <header className="app-header">
      <Link to="/homepage" className="brand">
        <span className="brand-icon">
          <MicIcon />
        </span>
        <span className="brand-name">MeetScribe</span>
      </Link>
    </header>
  )
}
