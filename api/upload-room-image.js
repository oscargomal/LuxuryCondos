import crypto from 'crypto';
import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

const ROOM_BUCKET = 'room-images';

const parseDataUrl = (dataUrl) => {
  if (!dataUrl) return null;
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64')
  };
};

const mimeToExt = (contentType) => {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };
  return map[contentType] || 'jpg';
};

const getFileExtension = (fileName, contentType) => {
  if (fileName && fileName.includes('.')) {
    const ext = fileName.split('.').pop().trim().toLowerCase();
    if (ext) return ext;
  }
  return mimeToExt(contentType);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const body = parseBody(req);
  const dataUrl = body.dataUrl;
  const fileName = body.fileName || 'room-image';

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    res.status(400).json({ error: 'Imagen inválida.' });
    return;
  }

  const ext = getFileExtension(fileName, parsed.contentType);
  const filePath = `rooms/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin
    .storage
    .from(ROOM_BUCKET)
    .upload(filePath, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: false
    });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { data } = supabaseAdmin
    .storage
    .from(ROOM_BUCKET)
    .getPublicUrl(filePath);

  res.status(200).json({ path: filePath, publicUrl: data?.publicUrl || '' });
}
