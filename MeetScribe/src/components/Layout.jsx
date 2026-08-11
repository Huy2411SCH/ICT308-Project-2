import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

// Shared shell for every authenticated page: sticky header, a
// centered content area, and a footer pinned to the bottom.
// Individual pages only need to worry about their own content —
// this wraps them via <Outlet />.
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
