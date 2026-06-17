export interface ImageOptimizerOptions {
  quality?: number
  format?: "image/webp" | "image/jpeg"
}

export interface ResizeToFitOptions extends ImageOptimizerOptions {
  mode: "fit"
  maxWidth: number
  maxHeight: number
}

export interface ResizeExactOptions extends ImageOptimizerOptions {
  mode: "exact"
  width: number
  height: number
}

export interface ResizeSmartCropOptions extends ImageOptimizerOptions {
  mode: "smart-crop"
  size: number
  padding?: number
}

export type OptimizerOptions = ResizeToFitOptions | ResizeExactOptions | ResizeSmartCropOptions

export async function optimizeImageOnClient(file: File, options: OptimizerOptions): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await window.createImageBitmap(file)
    const canvas = window.document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas context creation failed")

    const q = options.quality ?? 0.85
    const fmt = options.format ?? "image/webp"

    if (options.mode === "fit") {
      const { width, height } = fitWithin(bitmap.width, bitmap.height, options.maxWidth, options.maxHeight)
      canvas.width = width
      canvas.height = height
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(bitmap, 0, 0, width, height)
    } else if (options.mode === "exact") {
      const { sx, sy, sw, sh } = centerCrop(bitmap.width, bitmap.height, options.width, options.height)
      canvas.width = options.width
      canvas.height = options.height
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, options.width, options.height)
    } else if (options.mode === "smart-crop") {
      const scanCanvas = window.document.createElement("canvas")
      const sctx = scanCanvas.getContext("2d", { willReadFrequently: true })
      const scaleDown = bitmap.width > 1024 ? 1024 / bitmap.width : 1
      scanCanvas.width = Math.round(bitmap.width * scaleDown)
      scanCanvas.height = Math.round(bitmap.height * scaleDown)
      if (!sctx) throw new Error("Scan context creation failed")
      sctx.drawImage(bitmap, 0, 0, scanCanvas.width, scanCanvas.height)
      const imageData = sctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data

      let minX = scanCanvas.width, minY = scanCanvas.height, maxX = 0, maxY = 0
      let hasContent = false
      for (let y = 0; y < scanCanvas.height; y += 2) {
        for (let x = 0; x < scanCanvas.width; x += 2) {
          if (imageData[(y * scanCanvas.width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
            hasContent = true
          }
        }
      }

      const sourceX = hasContent ? (minX / scaleDown) : 0
      const sourceY = hasContent ? (minY / scaleDown) : 0
      const sourceW = hasContent ? ((maxX - minX + 1) / scaleDown) : bitmap.width
      const sourceH = hasContent ? ((maxY - minY + 1) / scaleDown) : bitmap.height

      const pad = options.padding ?? 48
      const inner = options.size - pad
      const aspect = sourceW / sourceH
      let dw: number, dh: number
      if (aspect > 1) {
        dw = inner; dh = inner / aspect
      } else {
        dh = inner; dw = inner * aspect
      }

      canvas.width = options.size
      canvas.height = options.size
      ctx.clearRect(0, 0, options.size, options.size)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(bitmap, sourceX, sourceY, sourceW, sourceH, (options.size - dw) / 2, (options.size - dh) / 2, dw, dh)
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Image encoding failed")),
        fmt,
        q
      )
    })
  } finally {
    if (bitmap) bitmap.close()
  }
}

function fitWithin(srcW: number, srcH: number, maxW: number, maxH: number) {
  let w = srcW, h = srcH
  if (w > maxW || h > maxH) {
    if (w > h) {
      h = Math.round((h * maxW) / w)
      w = maxW
    } else {
      w = Math.round((w * maxH) / h)
      h = maxH
    }
  }
  return { width: w, height: h }
}

function centerCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const targetAspect = dstW / dstH
  const sourceAspect = srcW / srcH
  let sx = 0, sy = 0, sw = srcW, sh = srcH
  if (sourceAspect > targetAspect) {
    sw = srcH * targetAspect
    sx = (srcW - sw) / 2
  } else {
    sh = srcW / targetAspect
    sy = (srcH - sh) / 2
  }
  return { sx, sy, sw, sh }
}
