import { Outlet } from 'react-router-dom'
import Header from './Header'
import './Layout.css'

export default function Layout({ user, onLogout }) {
  return (
    <div className="app-layout">
      <Header user={user} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}