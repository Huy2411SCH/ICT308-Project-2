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
import { filesService, normalizeDbFile } from '../lib/filesService'
import { retryTranscription } from '../lib/transcription'
import './FileDetail.css'

// How long a file can sit in 'processing' before we offer to retry it.
const STUCK_PROCESSING_MS = 15 * 60 * 1000

function fileIconFor(type) {
  if (type === 'video') return <VideoIcon />
  if (type === 'audio') return <MicIcon />
  return <FileTextIcon />
}

// Returns true if the given summary is a structured summary (with sections),
function isStructuredSummary(summary) {
  return Boolean(summary) && Array.isArray(summary.sections)
}
// Converts a structured summary into a plain text representation to dísplay in the UI or copy to the clipboard. Returns an empty string if the summary is not structured.
function summaryToText(summary) {
  const lines = [summary.title, summary.intro].filter(Boolean)
  for (const section of summary.sections) {
    lines.push(section.heading, ...section.points.map((point) => `- ${point}`))
  }
  if (summary.actionItems?.length > 0) {
    lines.push('Action Items', ...summary.actionItems.map((item) => `- ${item}`))
  }
  return lines.join('\n')
}

// Transcripts generated with speaker labels look like "Speaker A: ...\n\nSpeaker B: ...".
function toTurns(transcript) {
  if (!transcript) return []
  return transcript.split('\n\n').map((turn) => {
    const match = turn.match(/^(Speaker \w+):\s*([\s\S]*)$/)
    return match ? { speaker: match[1], text: match[2] } : { text: turn }
  })
}

function turnsToText(turns) {
  return turns.map((turn) => (turn.speaker ? `${turn.speaker}: ${turn.text}` : turn.text)).join('\n\n')
}

// Builds the plain text for the .txt download: a short header, then the
// summary (if there is one), then the full transcript.
function buildExportText(file, turns) {
  const header = [file.name, `Date: ${file.date}`, file.duration && `Duration: ${file.duration}`].filter(Boolean)
  const summary = isStructuredSummary(file.summary) ? summaryToText(file.summary) : 'No summary available.'
  return [
    ...header,
    '',
    'SUMMARY',
    '=======',
    summary,
    '',
    'TRANSCRIPT',
    '==========',
    turnsToText(turns),
    '',
  ].join('\n')
}

// The summary editor works on a draft where each list (points, action items)
// is one textarea with one item per line, which is easier to edit than
// separate inputs per bullet.
function summaryToDraft(summary) {
  return {
    title: summary.title || '',
    intro: summary.intro || '',
    sections: summary.sections.map((section) => ({
      heading: section.heading || '',
      points: section.points.join('\n'),
    })),
    actionItems: (summary.actionItems || []).join('\n'),
  }
}

function linesOf(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

// Converts the draft back into the stored summary shape, dropping empty sections.
function draftToSummary(draft) {
  return {
    title: draft.title.trim(),
    intro: draft.intro.trim(),
    sections: draft.sections
      .map((section) => ({ heading: section.heading.trim(), points: linesOf(section.points) }))
      .filter((section) => section.heading || section.points.length > 0),
    actionItems: linesOf(draft.actionItems),
  }
}

function speakersIn(turns) {
  return [...new Set(turns.map((turn) => turn.speaker).filter(Boolean))]
}

export default function FileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftTranscript, setDraftTranscript] = useState('')
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [selectedSpeakers, setSelectedSpeakers] = useState([])
  const [draftSummary, setDraftSummary] = useState(null)
  const [savingSummary, setSavingSummary] = useState(false)

  useEffect(() => {
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
  }, [id])

  useEffect(() => {
    return filesService.subscribeToFile(id, (row) => {
      setFile((prev) => (prev ? { ...prev, ...normalizeDbFile(row) } : normalizeDbFile(row)))
    })
  }, [id])

  // Realtime can miss the status flip (e.g. it lands before the channel is
  // subscribed), so poll as a fallback while the file is still processing.
  const awaitingResult = file?.status === 'processing'
  useEffect(() => {
    if (!awaitingResult) return
    const interval = setInterval(() => {
      filesService
        .getFile(id)
        .then((row) => {
          if (row.status !== 'processing') setFile(normalizeDbFile(row))
        })
        .catch((err) => console.error('Failed to refresh file:', err))
    }, 5000)
    return () => clearInterval(interval)
  }, [id, awaitingResult])

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
    if (file && !isStructuredSummary(file.summary)) setActiveTab('transcript')
  }, [file])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [menuOpen])
  useEffect(() => {
  setSelectedSpeakers([])
  setDraftSummary(null)
  }, [id])
  const turns = toTurns(file?.transcript)
  const speakers = speakersIn(turns)
  const visibleTurns = selectedSpeakers.length === 0
  ? turns
  : turns.filter((turn) => selectedSpeakers.includes(turn.speaker))

const toggleSpeaker = (speaker) => {
  setSelectedSpeakers((prev) =>
    prev.includes(speaker) ? prev.filter((s) => s !== speaker) : [...prev, speaker]
  )
}
  const handleDelete = async () => {
    if (!file) return
    if (!window.confirm(`Delete "${file.name}"? This can't be undone.`)) return
    try {
      await filesService.deleteFile(file)
      navigate('/files')
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }


// Returns the text to copy to the clipboard,
//  depending on the active tab. The transcript copy follows the speaker
//  filter; while editing, it copies the draft being edited instead.
  const handleCopy = async () => {
    const text = activeTab === 'summary' && isStructuredSummary(file.summary)
      ? summaryToText(file.summary)
      : isEditing
        ? draftTranscript
        : turnsToText(visibleTurns)


    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  // Saves the summary and full transcript as a .txt file named after the recording.
  const handleDownloadText = () => {
    const blob = new Blob([buildExportText(file, turns)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${file.name.replace(/\.[^.]+$/, '') || 'transcript'}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerateSummary = async () => {
    setSummarizing(true)
    setSummaryError(null)
    try {
      const updated = await filesService.generateSummary(file.id)
      setFile((prev) => ({ ...prev, summary: updated.summary }))
    } catch (err) {
     console.error('Failed to generate summary:', err)
      setSummaryError('Could not generate a summary. Please try again.')
    } finally {
     setSummarizing(false)
    }
  }

  // A job that's been processing this long has most likely died (e.g. the
  // backend restarted mid-job), so offer a retry. Re-check once the threshold passes.
  const processingSince = file?.status === 'processing'
    ? new Date(file.processing_started_at || file.created_at).getTime()
    : null
  useEffect(() => {
    if (processingSince === null) return
    const msUntilStuck = processingSince + STUCK_PROCESSING_MS - Date.now()
    const timeoutId = setTimeout(() => setNow(Date.now()), Math.max(0, msUntilStuck) + 1000)
    return () => clearTimeout(timeoutId)
  }, [processingSince])
  const isStuck = processingSince !== null && now - processingSince >= STUCK_PROCESSING_MS

  const handleRetryTranscription = async () => {
    setRetrying(true)
    setRetryError(null)
    try {
      const processingStartedAt = await retryTranscription(file)
      setFile((prev) => ({ ...prev, status: 'processing', processing_started_at: processingStartedAt }))
    } catch (err) {
      console.error('Failed to retry transcription:', err)
      setRetryError('Could not start transcription. Please try again in a moment.')
    } finally {
      setRetrying(false)
    }
  }

  const isEditingSummary = draftSummary !== null

  const startEditingSummary = () => {
    setSummaryError(null)
    setDraftSummary(summaryToDraft(file.summary))
  }

  const updateDraftSection = (index, field, value) => {
    setDraftSummary((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) => (i === index ? { ...section, [field]: value } : section)),
    }))
  }

  const addDraftSection = () => {
    setDraftSummary((prev) => ({ ...prev, sections: [...prev.sections, { heading: '', points: '' }] }))
  }

  const removeDraftSection = (index) => {
    setDraftSummary((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }))
  }

  const saveSummary = async () => {
    setSavingSummary(true)
    setSummaryError(null)
    try {
      const updated = await filesService.updateSummary(file.id, draftToSummary(draftSummary))
      setFile((prev) => ({ ...prev, summary: updated.summary }))
      setDraftSummary(null)
    } catch (err) {
      console.error('Failed to save summary:', err)
      setSummaryError('Could not save the summary. Please try again.')
    } finally {
      setSavingSummary(false)
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

  const isProcessing = file.status === 'processing'
  // Transcription finished but AssemblyAI heard nothing (silent recording).
  const hasNoSpeech = !isProcessing && file.status !== 'error' && !file.transcript?.trim()

  const retryControls = (
    <>
      <button className="btn btn-primary btn-sm retry-transcription-btn" onClick={handleRetryTranscription} disabled={retrying}>
        {retrying ? 'Retrying…' : 'Retry transcription'}
      </button>
      {retryError && <p className="summary-error">{retryError}</p>}
    </>
  )

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
                  <DownloadIcon /> Download recording
                </button>
                <button
                  className="dropdown-item dropdown-item-danger"
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

          <button className="btn btn-outline btn-sm detail-copy-btn" onClick={handleCopy} disabled={isProcessing || hasNoSpeech}>
            <CopyIcon /> {copied ? 'Copied!' : activeTab === 'summary' ? 'Copy summary' : 'Copy transcript'}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownloadText}
            disabled={isProcessing || hasNoSpeech || file.status === 'error'}
            title="Download the summary and transcript as a .txt file"
          >
            <DownloadIcon /> Download .txt
          </button>
        </div>

        {file.media_expired && (
          <p className="media-expired-note">
            The recording was automatically deleted 7 days after upload. The transcript and summary are still available.
          </p>
        )}
      </div>

      {file.status === 'error' ? (
        <div className="card">
          <div className="card-body processing-notice processing-notice-error">
            <p>Transcription failed.</p>
            {retryControls}
          </div>
        </div>
      ) : isProcessing ? (
        <div className="card">
          <div className="card-body processing-notice">
            <p>Transcription is still processing&hellip;</p>
            {isStuck && (
              <>
                <p>This is taking longer than expected. If it doesn&rsquo;t finish, you can start it again.</p>
                {retryControls}
              </>
            )}
          </div>
        </div>
      ) : hasNoSpeech ? (
        <div className="card">
          <div className="card-body processing-notice">No speech was detected in this recording.</div>
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

            {activeTab === 'summary' && isStructuredSummary(file.summary) && !isEditingSummary && (
              <button className="btn btn-outline btn-sm detail-edit-btn" onClick={startEditingSummary}>
                <PencilIcon /> Edit summary
              </button>
            )}
            {activeTab === 'transcript' && !isEditing && (
              <button className="btn btn-outline btn-sm detail-edit-btn" onClick={startEditing}>
                <PencilIcon /> Edit transcript
              </button>
            )}
          </div>

          {activeTab === 'summary' ? (
            <div className="card-body">
              {isEditingSummary ? (
                <div className="summary-edit">
                  <label className="summary-edit-field">
                    <span className="summary-edit-label">Title</span>
                    <input
                      className="summary-edit-input"
                      value={draftSummary.title}
                      onChange={(event) => setDraftSummary((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </label>
                  <label className="summary-edit-field">
                    <span className="summary-edit-label">Intro</span>
                    <textarea
                      className="summary-edit-textarea"
                      rows={3}
                      value={draftSummary.intro}
                      onChange={(event) => setDraftSummary((prev) => ({ ...prev, intro: event.target.value }))}
                    />
                  </label>

                  {draftSummary.sections.map((section, index) => (
                    <div className="summary-edit-section" key={index}>
                      <div className="summary-edit-section-header">
                        <input
                          className="summary-edit-input"
                          placeholder="Section heading"
                          value={section.heading}
                          onChange={(event) => updateDraftSection(index, 'heading', event.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeDraftSection(index)}
                          aria-label={`Remove section ${index + 1}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <textarea
                        className="summary-edit-textarea"
                        rows={4}
                        placeholder="One point per line"
                        value={section.points}
                        onChange={(event) => updateDraftSection(index, 'points', event.target.value)}
                      />
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm summary-edit-add" onClick={addDraftSection}>
                    + Add section
                  </button>

                  <label className="summary-edit-field">
                    <span className="summary-edit-label">Action items</span>
                    <textarea
                      className="summary-edit-textarea"
                      rows={3}
                      placeholder="One action item per line"
                      value={draftSummary.actionItems}
                      onChange={(event) => setDraftSummary((prev) => ({ ...prev, actionItems: event.target.value }))}
                    />
                  </label>

                  <div className="transcript-edit-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveSummary} disabled={savingSummary}>
                      {savingSummary ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDraftSummary(null)} disabled={savingSummary}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : isStructuredSummary(file.summary) ? (
                <>
                  {file.summary.title && <h3 className="summary-title">{file.summary.title}</h3>}
                  {file.summary.intro && <p className="summary-overview">{file.summary.intro}</p>}

                  {file.summary.sections.map((section, index) => (
                    <div className="summary-section" key={index}>
                      <h4 className="summary-subtitle">{section.heading}</h4>
                      <ul className="summary-list">
                        {section.points.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {file.summary.actionItems?.length > 0 && (
                    <div className="summary-section">
                      <h4 className="summary-subtitle">Action Items</h4>
                      <ul className="summary-list">
                        {file.summary.actionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="btn btn-outline btn-sm summary-regenerate-btn" onClick={handleGenerateSummary} disabled={summarizing}>
                    {summarizing ? 'Regenerating…' : 'Regenerate summary'}
                  </button>
                </>
              ) : (
                <>
                  <p className="summary-overview">No summary available yet.</p>
                  <button className="btn btn-primary btn-sm summary-generate-btn" onClick={handleGenerateSummary} disabled={summarizing}>
                    {summarizing ? 'Generating…' : 'Generate summary'}
                  </button>
                </>
              )}
              {summaryError && <p className="summary-error">{summaryError}</p>}
            </div>
          ) : (
            <div className="card-body">
              {speakers.length > 0 && !isEditing && (
                <div className="speakers-row">
                  <UsersIcon className="speakers-icon" />
                  <span className="speakers-label">Speakers</span>
                  <button
                    type="button"
                    className={`speaker-chip${selectedSpeakers.length === 0 ? ' speaker-chip-active' : ''}`}
                    onClick={() => setSelectedSpeakers([])}
                  >
                    All
                  </button>
                  {speakers.map((speaker) => (
                    <button
                      type="button"
                      key={speaker}
                      className={`speaker-chip${selectedSpeakers.includes(speaker) ? ' speaker-chip-active' : ''}`}
                      onClick={() => toggleSpeaker(speaker)}
                      aria-pressed={selectedSpeakers.includes(speaker)}
                    >
                      {speaker}
                    </button>
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
                  {visibleTurns.map((turn, index) => (
                    <div className="transcript-entry" key={index}>
                      {turn.speaker && (
                        <div className="transcript-meta">
                          <span className="transcript-speaker">{turn.speaker}</span>
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
