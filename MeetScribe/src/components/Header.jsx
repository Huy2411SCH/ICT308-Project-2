import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/dashboard" className="logo">
          <span className="logo-text">MeetScribe</span>
        </Link>
      </div>

      <div className="header-right">
        {user ? (
          <div className="user-menu">
            <span className="user-email">{user.email}</span>
            <button 
              className="avatar-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <Link to="/settings" className="dropdown-item">
                 Settings
                </Link>

                <Link to="/dashboard" className="dropdown-item">
                 Dashboard
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-btn">Login</Link>
        )}
      </div>
    </header>
  )
}