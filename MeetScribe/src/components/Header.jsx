import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MicIcon, SettingsIcon, LogoutIcon, ChevronDownIcon } from './icons'
import './Header.css'

export default function Header({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    setIsMenuOpen(false)
    onLogout()
    navigate('/login')
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

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
              <Link to="/settings" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                <SettingsIcon /> Settings
              </Link>
              <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
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
