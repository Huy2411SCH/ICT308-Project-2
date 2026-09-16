import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  FileTextIcon,
  ClockIcon,
  DownloadIcon,
  TrashIcon,
  VideoIcon,
  MicIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CopyIcon,
  MoreHorizontalIcon,
  UsersIcon,
  PencilIcon,
} from '../components/icons'
import { MOCK_FILES } from '../data/mockFiles'
import { filesService, normalizeDbFile } from '../lib/filesService'
import './FileDetail.css'

function fileIconFor(type) {
  if (type === 'video') return <VideoIcon />
  if (type === 'audio') return <MicIcon />
  return <FileTextIcon />
}

function isMockFile(file) {
  return typeof file.id === 'number'
}

// Transcripts generated with speaker labels look like "Speaker A: ...\n\nSpeaker B: ...".
// Older transcripts (and mock data) use an array of { speaker, time, text } turns instead.
function toTurns(transcript) {
  if (!transcript) return []
  if (Array.isArray(transcript)) return transcript
  return transcript.split('\n\n').map((turn) => {
    const match = turn.match(/^(Speaker \w+):\s*([\s\S]*)$/)
    return match ? { speaker: match[1], text: match[2] } : { text: turn }
  })
}

function turnsToText(turns) {
  return turns.map((turn) => (turn.speaker ? `${turn.speaker}: ${turn.text}` : turn.text)).join('\n\n')
}

function speakersIn(turns) {
  return [...new Set(turns.map((turn) => turn.speaker).filter(Boolean))]
}

export default function FileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const mockFile = MOCK_FILES.find((f) => String(f.id) === id)

  const [file, setFile] = useState(mockFile ?? null)
  const [loading, setLoading] = useState(!mockFile)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftTranscript, setDraftTranscript] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mockFile) return
    let cancelled = false

    filesService
      .getFile(id)
      .then((row) => {
        if (!cancelled) setFile(normalizeDbFile(row))
      })
      .catch((err) => {
        console.error('Failed to load file:', err)
        if (!cancelled) setFile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, mockFile])

  useEffect(() => {
    if (mockFile) return
    return filesService.subscribeToFile(id, (row) => {
      setFile((prev) => (prev ? { ...prev, ...normalizeDbFile(row) } : normalizeDbFile(row)))
    })
  }, [id, mockFile])

  useEffect(() => {
    if (!file?.media_url) return
    let cancelled = false

    filesService
      .getFileUrl(file.media_url)
      .then((url) => {
        if (!cancelled) setMediaUrl(url)
      })
      .catch((err) => console.error('Failed to get file URL:', err))

    return () => {
      cancelled = true
    }
  }, [file?.media_url])

  // Default to the Transcript tab when there's nothing to summarize yet.
  useEffect(() => {
    if (file && !file.summary) setActiveTab('transcript')
  }, [file])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [menuOpen])

  const handleDelete = async () => {
    if (!file || isMockFile(file)) return
    if (!window.confirm(`Delete "${file.name}"? This can't be undone.`)) return
    try {
      await filesService.deleteFile(file)
      navigate('/files')
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }

  const turns = toTurns(file?.transcript)
  const speakers = speakersIn(turns)

  const handleCopy = async () => {
    const text = activeTab === 'summary' && file.summary
      ? typeof file.summary === 'object'
        ? [file.summary.overview, ...(file.summary.keyPoints || [])].join('\n')
        : file.summary
      : turnsToText(turns)

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const startEditing = () => {
    setDraftTranscript(turnsToText(turns))
    setIsEditing(true)
  }

  const saveEditing = async () => {
    setSaving(true)
    try {
      const updated = await filesService.updateTranscript(file.id, draftTranscript)
      setFile((prev) => ({ ...prev, transcript: updated.transcript }))
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save transcript:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="file-detail-page">
        <Link to="/files" className="back-link">
          <ArrowLeftIcon className="back-icon" /> Back to Files
        </Link>
        <div className="card">
          <div className="card-body">Loading</div>
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="file-detail-page">
        <Link to="/files" className="back-link">
          <ArrowLeftIcon className="back-icon" /> Back to Files
        </Link>
        <div className="card">
          <div className="card-body">File not found.</div>
        </div>
      </div>
    )
  }

  const isProcessing = file.status === 'processing' || !file.transcript

  return (
    <div className="file-detail-page">
      <Link to="/files" className="back-link">
        <ArrowLeftIcon className="back-icon" /> Back to Files
      </Link>

      <div className="detail-card">
        <div className="detail-title-row">
          <div className="detail-title-group">
            <div className="file-icon file-icon-lg">{fileIconFor(file.type)}</div>
            <h1 className="detail-name">{file.name}</h1>
          </div>

          <div className="detail-menu" ref={menuRef}>
            <button
              className="btn btn-ghost btn-sm detail-menu-trigger"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="More actions"
            >
              <MoreHorizontalIcon />
            </button>
            {menuOpen && (
              <div className="detail-menu-dropdown">
                <button
                  className="dropdown-item"
                  disabled={!mediaUrl}
                  onClick={() => {
                    setMenuOpen(false)
                    if (mediaUrl) window.open(mediaUrl, '_blank', 'noopener')
                  }}
                >
                  <DownloadIcon /> Download
                </button>
                <button
                  className="dropdown-item dropdown-item-danger"
                  disabled={isMockFile(file)}
                  onClick={() => {
                    setMenuOpen(false)
                    handleDelete()
                  }}
                >
                  <TrashIcon /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-meta-row">
          <span>
            <CalendarIcon /> {file.date}
          </span>
          {file.duration && (
            <span>
              <ClockIcon /> {file.duration}
            </span>
          )}
          <span className={`badge badge-${file.status}`}>{file.status}</span>

          <button className="btn btn-outline btn-sm detail-copy-btn" onClick={handleCopy} disabled={isProcessing}>
            <CopyIcon /> {copied ? 'Copied!' : activeTab === 'summary' ? 'Copy summary' : 'Copy transcript'}
          </button>
        </div>
      </div>

      {isProcessing ? (
        <div className="card">
          <div className="card-body processing-notice">Transcription is still processing&hellip;</div>
        </div>
      ) : (
        <div className="card detail-content-card">
          <div className="detail-tabs">
            <button
              className={`detail-tab${activeTab === 'summary' ? ' detail-tab-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
            <button
              className={`detail-tab${activeTab === 'transcript' ? ' detail-tab-active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>

            {activeTab === 'transcript' && !isMockFile(file) && !isEditing && (
              <button className="btn btn-outline btn-sm detail-edit-btn" onClick={startEditing}>
                <PencilIcon /> Edit transcript
              </button>
            )}
          </div>

          {activeTab === 'summary' ? (
            <div className="card-body">
              {file.summary && typeof file.summary === 'object' ? (
                <>
                  <p className="summary-overview">{file.summary.overview}</p>

                  <h3 className="summary-subtitle">Key Points</h3>
                  <ul className="summary-list">
                    {file.summary.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>

                  {file.summary.actionItems?.length > 0 && (
                    <>
                      <h3 className="summary-subtitle">Action Items</h3>
                      <ul className="summary-list">
                        {file.summary.actionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p className="summary-overview">No summary available yet.</p>
              )}
            </div>
          ) : (
            <div className="card-body">
              {speakers.length > 0 && (
                <div className="speakers-row">
                  <UsersIcon className="speakers-icon" />
                  <span className="speakers-label">Speakers</span>
                  {speakers.map((speaker) => (
                    <span key={speaker} className="badge badge-outline">
                      {speaker}
                    </span>
                  ))}
                </div>
              )}

              {isEditing ? (
                <div className="transcript-edit">
                  <textarea
                    className="transcript-edit-textarea"
                    value={draftTranscript}
                    onChange={(event) => setDraftTranscript(event.target.value)}
                  />
                  <div className="transcript-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveEditing} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="transcript-body">
                  {turns.map((turn, index) => (
                    <div className="transcript-entry" key={index}>
                      {(turn.speaker || turn.time) && (
                        <div className="transcript-meta">
                          {turn.speaker && <span className="transcript-speaker">{turn.speaker}</span>}
                          {turn.time && <span className="transcript-time">{turn.time}</span>}
                        </div>
                      )}
                      <p>{turn.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
