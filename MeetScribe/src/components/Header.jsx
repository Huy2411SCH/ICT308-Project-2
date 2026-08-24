import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MicIcon, FileTextIcon, SettingsIcon, LogoutIcon, ChevronDownIcon } from './icons'
import './Header.css'
import { authService } from '../lib/authService'
export default function Header({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()


  const displayName = user?.user_metadata?.name || user?.email
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U'

  return (
    <header className="app-header">
      <Link to="/dashboard" className="brand">
        <span className="brand-icon">
          <MicIcon />
        </span>
        <span className="brand-name">MeetScribe</span>
      </Link>

      {user ? (
        <div className="account-menu">
          <button
            className="account-trigger"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
          >
            <span className="account-avatar">{initial}</span>
            <span className="account-email">{user.email}</span>
            <ChevronDownIcon className="account-chevron" />
          </button>

          {isMenuOpen && (
            // Clicking a link closes the menu so it doesn't stay open after navigating.
            <div className="account-dropdown">
              <Link to="/files" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                <FileTextIcon /> My Files
              </Link>
              <Link to="/settings" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                <SettingsIcon /> Settings
              </Link>
              <button className="dropdown-item dropdown-item-danger" onClick={() => authService.signOut()}>
                <LogoutIcon /> Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="btn btn-primary">
          Sign in
        </Link>
      )}
    </header>
  )
}
