import './Dashboard.css'

export default function Dashboard({ user }) {


  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back {user?.name || 'User'}</h1>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="quick-actions">
          <h2>Dashboard</h2>
          <div className="action-grid">
            <button className="action-card">
              <h4>Upload Media</h4>
              <p>Audio or video files</p>
            </button>
            <button className="action-card">

              <h4>Upload Transcript</h4>
              <p>Paste or upload text</p>
            </button>
            <button className="action-card">

              <h4>View Transcripts</h4>
              <p>All your transcripts</p>
            </button>
            <button className="action-card">

              <h4>Generate Notes</h4>
              <p>AI-powered meeting notes</p>
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}