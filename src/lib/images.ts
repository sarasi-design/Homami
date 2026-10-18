/**
 * Shrinks a photo before upload: longest side 640px by default (posts use 1280), JPEG. A 5 MB phone photo becomes ~60–120 KB,
 * so uploads are quick on mobile data. The photo's rotation from the phone camera is respected.
 */
export async function shrinkImage(file: File, maxSide = 640, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the photo')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the photo'))), 'image/jpeg', quality),
  )
}
