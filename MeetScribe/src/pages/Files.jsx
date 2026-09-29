import { useState } from 'react'
import { FileTextIcon, ClockIcon, DownloadIcon, TrashIcon, VideoIcon, MicIcon } from '../components/icons'
import './Files.css'

// Placeholder data — belongs to the signed-in user once wired to a backend.
const MOCK_FILES = [
  { id: 1, name: 'Q4 Strategy Meeting.mp4', type: 'video', duration: '45:32', date: 'May 18, 2026', size: '210 MB', status: 'ready' },
  { id: 2, name: 'Client Onboarding Call.mp3', type: 'audio', duration: '22:10', date: 'May 12, 2026', size: '18 MB', status: 'processing' },
  { id: 3, name: 'Sprint Retro Notes.txt', type: 'transcript', duration: null, date: 'May 5, 2026', size: '4 KB', status: 'ready' },
  { id: 4, name: 'Design Review.mp4', type: 'video', duration: '31:08', date: 'Apr 29, 2026', size: '156 MB', status: 'ready' },
]

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
  { key: 'transcript', label: 'Transcripts' },
]

function fileIconFor(type) {
  if (type === 'video') return <VideoIcon />
  if (type === 'audio') return <MicIcon />
  return <FileTextIcon />
}

export default function Files({ user }) {
  const [activeTab, setActiveTab] = useState('all')

  const filtered = activeTab === 'all' ? MOCK_FILES : MOCK_FILES.filter((file) => file.type === activeTab)

  return (
    <div className="files-page">
      <h1 className="files-title">
        {user?.user_metadata?.name || user?.email ? `${user.user_metadata?.name || user.email}'s Files` : 'Your Files'}
      </h1>

      <div className="file-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`file-tab${activeTab === tab.key ? ' file-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="card file-list">
        {filtered.length === 0 ? (
          <div className="file-list-empty">No files in this category yet.</div>
        ) : (
          filtered.map((file) => (
            <div key={file.id} className="file-row">
              <div className="file-icon">{fileIconFor(file.type)}</div>

              <div className="file-meta">
                <div className="file-name">{file.name}</div>
                <div className="file-details">
                  {file.duration && (
                    <span>
                      <ClockIcon /> {file.duration}
                    </span>
                  )}
                  <span>{file.date}</span>
                  <span>{file.size}</span>
                  <span className={`badge badge-${file.status}`}>{file.status}</span>
                </div>
              </div>

              <div className="file-actions">
                <button className="btn btn-outline btn-sm">
                  <DownloadIcon /> Download
                </button>
                <button className="btn btn-ghost btn-sm">
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
