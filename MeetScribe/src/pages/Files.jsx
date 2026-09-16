import { useEffect, useRef, useState } from 'react'
import { FileTextIcon, ClockIcon, DownloadIcon, TrashIcon, VideoIcon, MicIcon, UploadCloudIcon, ChevronDownIcon } from '../components/icons'
import FilePreview from '../components/FilePreview'
import { uploadMediaForTranscription, fetchFiles, deleteFile, subscribeToFiles, getMediaDownloadUrl } from '../lib/transcription'
import './Files.css'

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

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Transcripts generated with speaker labels look like "Speaker A: ...\n\nSpeaker B: ...".
// Render each turn as its own line with the speaker name bolded; older
// transcripts with no speaker prefix just render as a single block.
function TranscriptView({ text }) {
  return text.split('\n\n').map((turn, i) => {
    const match = turn.match(/^(Speaker \w+):\s*([\s\S]*)$/)
    return (
      <p key={i} className="transcript-line">
        {match ? (
          <>
            <strong>{match[1]}:</strong> {match[2]}
          </>
        ) : (
          turn
        )}
      </p>
    )
  })
}

export default function Files({ user }) {
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('all')
  const [files, setFiles] = useState([])
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user) return

    const loadFiles = () => fetchFiles().then(setFiles).catch((err) => setError(err.message))

    loadFiles()

    // Reflect status flipping from 'processing' to 'ready' once the server finishes transcribing.
    return subscribeToFiles(user.id, loadFiles)
  }, [user])

  const openFilePicker = () => fileInputRef.current?.click()

  const cancelPendingFile = () => {
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChangeFile = () => {
    cancelPendingFile()
    openFilePicker()
  }

  const confirmUpload = async () => {
    if (!user || !pendingFile) return
    setUploading(true)
    setError(null)

    try {
      const fileRow = await uploadMediaForTranscription(user, pendingFile)
      setFiles((prev) => [fileRow, ...prev])
      cancelPendingFile()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (file) => {
    try {
      await deleteFile(file.id)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDownload = async (file) => {
    try {
      const url = await getMediaDownloadUrl(file.media_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = activeTab === 'all' ? files : files.filter((file) => file.type === activeTab)

  return (
    <div className="files-page">
      <div className="files-header">
        <h1 className="files-title">
          {user?.user_metadata?.name || user?.email ? `${user.user_metadata?.name || user.email}'s Files` : 'Your Files'}
        </h1>

        {!pendingFile && (
          <button className="btn btn-primary" onClick={openFilePicker}>
            <UploadCloudIcon /> Upload
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) setPendingFile(file)
          }}
        />
      </div>

      {error && <div className="file-list-error">{error}</div>}

      {pendingFile && (
        <section className="card file-upload-panel">
          <FilePreview file={pendingFile} onChangeFile={handleChangeFile} />
          <div className="file-upload-actions">
            <button className="btn btn-primary" onClick={confirmUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button className="btn btn-ghost" onClick={cancelPendingFile} disabled={uploading}>
              Cancel
            </button>
          </div>
        </section>
      )}

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
          filtered.map((file) => {
            const isExpanded = expandedId === file.id
            return (
              <div key={file.id} className="file-row-wrap">
                <div className="file-row">
                  <div className="file-icon">{fileIconFor(file.type)}</div>

                  <div className="file-meta">
                    <div className="file-name">{file.name}</div>
                    <div className="file-details">
                      {file.duration && (
                        <span>
                          <ClockIcon /> {file.duration}
                        </span>
                      )}
                      <span>{formatDate(file.created_at)}</span>
                      <span className={`badge badge-${file.status}`}>{file.status}</span>
                    </div>
                  </div>

                  <div className="file-actions">
                    {file.transcript && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setExpandedId(isExpanded ? null : file.id)}
                      >
                        <ChevronDownIcon className={isExpanded ? 'icon-flipped' : ''} />
                        {isExpanded ? 'Hide' : 'View'} Transcript
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => handleDownload(file)}>
                      <DownloadIcon /> Download
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(file)}>
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="file-transcript">
                    <TranscriptView text={file.transcript} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
