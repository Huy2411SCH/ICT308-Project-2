// Browser-recorded WebM files have no duration in their header, so the player
// reports Infinity and the seek bar doesn't work. Seeking past the end forces
// the browser to scan the file and work out the real duration.
// Use as a <video>/<audio> onLoadedMetadata handler.
export function fixUnknownDuration(event) {
  const media = event.currentTarget
  if (media.duration !== Infinity) return
  media.addEventListener('timeupdate', () => { media.currentTime = 0 }, { once: true })
  media.currentTime = Number.MAX_SAFE_INTEGER
}
