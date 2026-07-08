"use client"

import { Plugin, PluginKey } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"

const imageUploadKey = new PluginKey("image-upload")

/**
 * Custom TiP tap plugin that intercepts pasted/dropped images,
 * uploads them via the existing /api/upload endpoint,
 * and inserts the returned URL into the editor.
 */
export function createImageUploadPlugin(_editor: Editor): Plugin {
  return new Plugin({
    key: imageUploadKey,

    props: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) uploadAndInsert(_editor, file)
            return true
          }
        }
        return false
      },

      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault()
            uploadAndInsert(_editor, file)
            return true
          }
        }
        return false
      },
    },
  })
}

export { imageUploadKey }

async function uploadAndInsert(editor: Editor, file: File) {
  // Show a loading placeholder
  editor
    .chain()
    .focus()
    .setImage({ src: "", alt: "Učitavanje..." })
    .run()

  try {
    const formData = new FormData()
    formData.append("file", file)

    const { uploadImageAction } = await import("@/app/(server)/actions/upload")
    const result = await uploadImageAction(formData)

    if (!result.success) throw new Error(result.error || "Upload failed")

    editor.chain().focus().setImage({ src: result.url! }).run()
  } catch (err) {
    console.error("[CMS Image Upload]", err)
    // Remove the failed placeholder
    editor.chain().focus().undo().run()
  }
}
