import './Footer.css'

// Simple site-wide footer shown under every page's content.
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <p>&copy; {year} MeetScribe. All rights reserved.</p>
    </footer>
  )
}
