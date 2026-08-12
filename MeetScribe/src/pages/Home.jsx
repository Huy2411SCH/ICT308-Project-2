import { Link } from 'react-router-dom'
import { MicIcon, UploadCloudIcon, SparklesIcon, ShieldIcon } from '../components/icons'
import HomeHeader from '../components/HomeHeader'
import Footer from '../components/Footer'
import './Home.css'

// What we show off on the landing page. Kept as data so the section below
// stays a simple map instead of four near-identical blocks of markup.
const FEATURES = [
  {
    icon: MicIcon,
    title: 'Record in your browser',
    description: 'Capture audio or video straight from the dashboard — no separate app to install.',
  },
  {
    icon: UploadCloudIcon,
    title: 'Bring your own files',
    description: 'Already have a recording or transcript on hand? Upload it and pick up from there.',
  },
  {
    icon: SparklesIcon,
    title: 'AI-generated notes',
    description: 'A summary, key decisions, and action items are pulled from the conversation automatically.',
  },
  {
    icon: ShieldIcon,
    title: 'Built with privacy in mind',
    description: 'Files are kept only as long as processing requires, and sensitive details can be masked.',
  },
]

export default function Home() {
  return (
    <div className="home-page">
      <HomeHeader />

      <section className="home-hero">
        <h1>
          Every meeting, <span>written up for you</span>
        </h1>
        <p>
          MeetScribe records, transcribes, and summarizes your meetings so you can stay in the
          conversation instead of taking notes.
        </p>
        <div className="home-hero-actions">
          <Link to="/login" className="btn btn-primary btn-lg">
            Get started
          </Link>
          <a href="#features" className="btn btn-outline btn-lg">
            See how it works
          </a>
        </div>
      </section>

      <section className="home-features" id="features">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div className="feature-card" key={title}>
            <span className="feature-icon">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  )
}
