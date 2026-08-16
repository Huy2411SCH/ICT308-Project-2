import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

// Page shell: header, content, footer
export default function Layout({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Header user={user} onLogout={onLogout} />
      <main className="page-container">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
