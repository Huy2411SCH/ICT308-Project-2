import { useEffect, useState } from 'react'
import FileRow from '../components/FileRow'
import { MOCK_FILES } from '../data/mockFiles'
import { filesService, normalizeDbFile } from '../lib/filesService'
import './Files.css'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
  { key: 'transcript', label: 'Transcripts' },
]

export default function Files({ user }) {
  const [activeTab, setActiveTab] = useState('all')
  const [files, setFiles] = useState(MOCK_FILES)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const realFiles = await filesService.listFiles()
      setFiles([...realFiles.map(normalizeDbFile), ...MOCK_FILES])
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = activeTab === 'all' ? files : files.filter((file) => file.type === activeTab)

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
        {loading ? (
          <div className="file-list-empty">Loading files&hellip;</div>
        ) : filtered.length === 0 ? (
          <div className="file-list-empty">No files in this category yet.</div>
        ) : (
          filtered.map((file) => <FileRow key={file.id} file={file} onDeleted={refresh} />)
        )}
      </section>
    </div>
  )
}
