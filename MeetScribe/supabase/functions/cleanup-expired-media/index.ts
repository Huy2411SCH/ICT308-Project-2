import { createClient } from 'npm:@supabase/supabase-js@2'

const MEDIA_RETENTION_DAYS = 7
const BATCH_SIZE = 500

// Service-role client: bypasses RLS so it can clean up every user's media.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Deletes uploaded video/audio older than MEDIA_RETENTION_DAYS. Only the
// Storage object is removed; the `files` row keeps its transcript and summary.
// Invoked hourly by pg_cron (see the schedule_media_cleanup migration).
Deno.serve(async (req) => {
  // Only the pg_cron job knows this secret; reject everyone else.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cutoff = new Date(Date.now() - MEDIA_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: expired, error } = await supabase
    .from('files')
    .select('id, media_url')
    .not('media_url', 'is', null)
    .neq('status', 'processing') // don't pull media out from under an active transcription
    .lt('created_at', cutoff)
    .limit(BATCH_SIZE)
  if (error) return json({ error: error.message }, 500)
  if (expired.length === 0) return json({ removed: 0 })

  const { error: removeError } = await supabase.storage.from('media').remove(expired.map((f) => f.media_url))
  if (removeError) return json({ error: removeError.message }, 500)

  const { error: updateError } = await supabase
    .from('files')
    .update({ media_url: null, media_expired: true })
    .in('id', expired.map((f) => f.id))
  if (updateError) return json({ error: updateError.message }, 500)

  console.log(`Media cleanup: removed ${expired.length} expired file(s)`)
  return json({ removed: expired.length })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
