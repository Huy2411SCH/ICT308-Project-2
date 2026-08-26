import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <p>&copy; {year} MeetScribe. All rights reserved.</p>
    </footer>
  )
}
