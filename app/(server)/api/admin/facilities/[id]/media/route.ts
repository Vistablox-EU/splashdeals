import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin, validateFacilityAccess } from "@/server/lib/auth-guards"
import { handleServerActionError } from "@/server/lib/server-action-error"
import { put } from "@vercel/blob"
import { mediaUploadSchema } from "@/server/lib/validations/media"
import { processImageToWebP, generateThumbnail } from "@/server/lib/media"
import { parse } from "url"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

/**
 * 🛡️ SSRF Protection: Blocks loopback and private/internal hostname patterns.
 */
function isPrivateHost(urlString: string): boolean {
  try {
    const parsed = parse(urlString)
    const hostname = parsed.hostname
    if (!hostname) return true
    
    const privatePatterns = [
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,       // 127.0.0.0/8 loopback
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,          // 10.0.0.0/8 private network
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12 private network
      /^192\.168\.\d{1,3}\.\d{1,3}$/,              // 192.168.0.0/16 private network
      /^0\.0\.0\.0$/,
      /^localhost$/i,
      /^::1$/,
      /^[0:]+1$/,
      /\.local$/i,
      /\.internal$/i,
    ]
    
    return privatePatterns.some(pattern => pattern.test(hostname))
  } catch {
    return true
  }
}

/**
 * 🖼️ Facility Media API - Secure Upload, WebP Optimize, Thumbnail & Link
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate (API Key or Session)
    const user = await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id: facilityId } = await params

    // 2. Authorize
    await validateFacilityAccess(facilityId, user)

    // 3. Validate Request Payload
    const json = await request.json()
    const validated = mediaUploadSchema.parse(json)

    // Check mode: "review" saves locally for agent review, "publish" (default) uploads to Blob
    const mode = new URL(request.url).searchParams.get("mode") || "publish"

    let buffer: Buffer | null = null

    // 4. Handle Input Sources (URL prioritised over Base64)
    if (validated.url) {
      let currentUrl = validated.url
      let response: Response | null = null
      let redirectCount = 0
      
      // SSRF validation and redirects follow loop (max 5 hops)
      while (redirectCount <= 5) {
        if (isPrivateHost(currentUrl)) {
          return NextResponse.json({
            success: false,
            error: "URL vodi ka privatnoj ili internoj mreži",
            code: "SSRF_BLOCKED"
          }, { status: 400 })
        }
        
        response = await fetch(currentUrl, {
          method: "GET",
          signal: AbortSignal.timeout(10000), // 10 seconds timeout
          redirect: "manual",
        }).catch(err => {
          if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
            throw new Error("DOWNLOAD_TIMEOUT")
          }
          throw err
        })
        
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location")
          if (!location) {
            return NextResponse.json({
              success: false,
              error: "Greška pri preusmeravanju slike",
              code: "HTTP_ERROR"
            }, { status: 400 })
          }
          currentUrl = new URL(location, currentUrl).toString()
          redirectCount++
          continue
        }
        break
      }
      
      if (redirectCount > 5) {
        return NextResponse.json({
          success: false,
          error: "Previše preusmeravanja pri preuzimanju slike",
          code: "TOO_MANY_REDIRECTS"
        }, { status: 400 })
      }

      if (!response || !response.ok) {
        return NextResponse.json({
          success: false,
          error: `Greška pri preuzimanju: HTTP ${response?.status || 500}`,
          code: "HTTP_ERROR"
        }, { status: 400 })
      }

      // Content-Type validation
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.startsWith("image/")) {
        return NextResponse.json({
          success: false,
          error: `URL ne vodi ka podržanoj slici. Dobijeno: ${contentType || "nepoznato"}`,
          code: "INVALID_CONTENT_TYPE"
        }, { status: 400 })
      }

      // Size checking (max 10MB)
      const contentLenHeader = response.headers.get("content-length")
      if (contentLenHeader) {
        const contentLen = parseInt(contentLenHeader, 10)
        if (contentLen > 10 * 1024 * 1024) {
          return NextResponse.json({
            success: false,
            error: "Slika prelazi maksimalnu veličinu od 10MB",
            code: "FILE_TOO_LARGE"
          }, { status: 400 })
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)

      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: "Slika prelazi maksimalnu veličinu od 10MB",
          code: "FILE_TOO_LARGE"
        }, { status: 400 })
      }
    } else if (validated.base64) {
      // Decode Base64 buffer
      buffer = Buffer.from(validated.base64.split(",")[1] || validated.base64, "base64")
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: "Slika prelazi maksimalnu veličinu od 10MB",
          code: "FILE_TOO_LARGE"
        }, { status: 400 })
      }
    }

    if (!buffer) {
      return NextResponse.json({
        success: false,
        error: "Nije prosleđen URL ili base64 podatak",
        code: "NO_INPUT"
      }, { status: 400 })
    }

    // 5. Image processing pipeline (Sharp optimization & WebP convert)
    let processedBuffer: Buffer
    try {
      processedBuffer = await processImageToWebP(buffer)
    } catch {
      return NextResponse.json({
        success: false,
        error: "Preuzeta datoteka nije validna slika ili je oštećena",
        code: "INVALID_IMAGE"
      }, { status: 400 })
    }

    // ── Agent review mode: save locally, skip Blob & DB ──────────────
    if (mode === "review") {
      const timestamp = Date.now()
      const baseDir = path.join(process.cwd(), "public", "facility-images", facilityId)
      const thumbDir = path.join(baseDir, "thumbnails")
      await mkdir(thumbDir, { recursive: true })

      const mainFilename = `${timestamp}-image.webp`
      const mainPath = path.join(baseDir, mainFilename)
      await writeFile(mainPath, processedBuffer)

      let thumbnailPath: string | null = null
      try {
        const thumbBuffer = await generateThumbnail(buffer)
        const thumbFilename = `${timestamp}-image.webp`
        thumbnailPath = `/facility-images/${facilityId}/thumbnails/${thumbFilename}`
        await writeFile(path.join(thumbDir, thumbFilename), thumbBuffer)
      } catch (err: unknown) {
        console.error("Failed to generate thumbnail for review (skipped):", err)
      }

      return NextResponse.json({
        success: true,
        path: `/facility-images/${facilityId}/${mainFilename}`,
        thumbnailPath,
        mode: "review",
        originalUrl: validated.url || null,
      }, { status: 201 })
    }

    // 6. Generate and upload WebP thumbnail (400x400)
    let thumbUrl: string | null = null
    try {
      const thumbBuffer = await generateThumbnail(buffer)
      const timestamp = Date.now()
      const thumbFilename = `facilities/${facilityId}/photos/thumbnails/${timestamp}-image.webp`
      const thumbBlob = await put(thumbFilename, thumbBuffer, {
        access: "public",
        contentType: "image/webp"
      })
      thumbUrl = thumbBlob.url
    } catch (err: unknown) {
      console.error("Failed to generate/upload WebP thumbnail (skipped):", err)
    }

    // 7. Upload main WebP image
    const timestamp = Date.now()
    const filename = `facilities/${facilityId}/photos/${timestamp}-image.webp`
    const blob = await put(filename, processedBuffer, {
      access: "public",
      contentType: "image/webp"
    })
    const mainUrl = blob.url

    // 8. Auto-increment gallery display order
    const lastMedia = await prisma.facilityMedia.findFirst({
      where: { facilityId },
      orderBy: { order: "desc" },
      select: { order: true }
    })
    const nextOrder = lastMedia ? lastMedia.order + 1 : 0

    // 9. Unset other Heroes if setting new Hero
    if (validated.isHero) {
      await prisma.facilityMedia.updateMany({
        where: { facilityId, isHero: true },
        data: { isHero: false }
      })
    }

    // 10. Save to Database
    const media = await prisma.facilityMedia.create({
      data: {
        facilityId,
        url: mainUrl,
        thumbnailUrl: thumbUrl,
        originalUrl: validated.url || null,
        type: validated.type,
        purpose: validated.purpose,
        caption: validated.caption,
        order: nextOrder,
        isHero: validated.isHero,
        isCardBackground: validated.isCardBackground,
        isGalleryVisible: true
      }
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "DOWNLOAD_TIMEOUT") {
      return NextResponse.json({
        success: false,
        error: "Isteklo je vreme za preuzimanje slike (10s)",
        code: "DOWNLOAD_TIMEOUT"
      }, { status: 400 })
    }
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
