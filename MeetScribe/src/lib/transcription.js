import { supabase } from './supabaseClient'

const TRANSCRIBE_ENDPOINT = 'http://localhost:3001/transcribe'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // long enough for AssemblyAI to fetch the file

// Uploads an audio/video file to Supabase Storage, creates its `files` row,
// and kicks off transcription on the backend. Returns the inserted row.
export async function uploadMediaForTranscription(user, file) {
  const path = `${user.id}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
  if (uploadError) throw uploadError

  const { data: signed, error: signError } = await supabase.storage
    .from('media')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (signError) throw signError

  // Store the storage path, not the signed URL — the signed URL expires in an
  // hour, but the path is stable and a fresh signed URL can be minted for it
  // whenever it's actually needed (download, playback).
  const { data: fileRow, error: insertError } = await supabase
    .from('files')
    .insert({
      user_id: user.id,
      name: file.name,
      type: file.type.startsWith('video') ? 'video' : 'audio',
      status: 'processing',
      media_url: path,
    })
    .select()
    .single()
  if (insertError) throw insertError

  await fetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: fileRow.id, mediaUrl: signed.signedUrl }),
  })

  return fileRow
}

// `files.media_url` holds a storage path, not a fetchable URL — mint a fresh
// signed URL on demand for downloads/playback.
export async function getMediaDownloadUrl(path) {
  const { data, error } = await supabase.storage.from('media').createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

export async function fetchFiles() {
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteFile(fileId) {
  const { error } = await supabase.from('files').delete().eq('id', fileId)
  if (error) throw error
}

// Calls `onChange` whenever any of the user's files rows change (e.g. status
// flips from 'processing' to 'ready'). Returns an unsubscribe function.
export function subscribeToFiles(userId, onChange) {
  const channel = supabase
    .channel('files-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'files', filter: `user_id=eq.${userId}` },
      onChange
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
