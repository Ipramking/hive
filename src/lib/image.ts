// Turn a picked image File into a compact base64 data URL. We downscale to a
// sane max edge and re-encode to keep the payload well under the serverless body
// limit (and cheap to ship to the vision model). Falls back to the raw file if
// canvas encoding isn't available.

export interface PickedImage {
  dataUrl: string
  name: string
}

const MAX_EDGE = 1280
const MIME_OUT = 'image/jpeg'
const QUALITY = 0.82

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(file)
  })
}

export async function fileToPickedImage(file: File): Promise<PickedImage> {
  const raw = await readAsDataUrl(file)
  try {
    const img = await loadImage(raw)
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return { dataUrl: raw, name: file.name }
    ctx.drawImage(img, 0, 0, w, h)
    // PNGs with transparency get a flat background so JPEG doesn't blacken them
    const out = canvas.toDataURL(MIME_OUT, QUALITY)
    return { dataUrl: out || raw, name: file.name }
  } catch {
    return { dataUrl: raw, name: file.name }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
