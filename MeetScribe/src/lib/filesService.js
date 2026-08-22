import { supabase } from './supabaseClient'

const BUCKET = 'media'

function inferFileType(file) {
  const mime = file.type || ''
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'transcript'
}

// Turns a raw `files` table row into the shape the UI renders (adds a formatted `date`).
export function normalizeDbFile(row) {
  return {
    ...row,
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
  }
}

export const filesService = {
  async listFiles() {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getFile(id) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async uploadFile(file, userId) {
    const type = inferFileType(file)
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        name: file.name,
        type,
        media_url: path,
        status: type === 'transcript' ? 'ready' : 'processing',
      })
      .select()
      .single()

    if (insertError) throw insertError
    return data
  },

  async getFileUrl(mediaPath, expiresIn = 3600) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(mediaPath, expiresIn)
    if (error) throw error
    return data.signedUrl
  },

  async deleteFile(file) {
    if (file.media_url) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.media_url])
      if (storageError) throw storageError
    }
    const { error } = await supabase.from('files').delete().eq('id', file.id)
    if (error) throw error
  },
}
