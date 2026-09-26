import { describe, it, expect, vi, afterEach } from 'vitest'
import { isSystemAudioCaptureSupported } from '../meetingRecorder'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isSystemAudioCaptureSupported', () => {
  it('returns true when getDisplayMedia and MediaRecorder exist', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: () => {} } })
    vi.stubGlobal('MediaRecorder', function MediaRecorder() {})
    expect(isSystemAudioCaptureSupported()).toBe(true)
  })

  it('returns false when getDisplayMedia is unavailable', () => {
    vi.stubGlobal('navigator', { mediaDevices: {} })
    vi.stubGlobal('MediaRecorder', function MediaRecorder() {})
    expect(isSystemAudioCaptureSupported()).toBe(false)
  })

  it('returns false when MediaRecorder is unavailable', () => {
    vi.stubGlobal('navigator', { mediaDevices: { getDisplayMedia: () => {} } })
    vi.stubGlobal('MediaRecorder', undefined)
    expect(isSystemAudioCaptureSupported()).toBe(false)
  })
})
