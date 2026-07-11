"use client";

import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";

const imageUploadKey = new PluginKey("image-upload");

/**
 * Custom Tiptap plugin that intercepts pasted/dropped images,
 * uploads them via the media library action (WebP + resize + cache),
 * and inserts the returned URL into the editor.
 */
export function createImageUploadPlugin(_editor: Editor, source?: "blog" | "stranica"): Plugin {
  return new Plugin({
    key: imageUploadKey,

    props: {
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadAndInsert(_editor, file, source);
            return true;
          }
        }
        return false;
      },

      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadAndInsert(_editor, file, source);
            return true;
          }
        }
        return false;
      },
    },
  });
}

export { imageUploadKey };

async function uploadAndInsert(editor: Editor, file: File, source?: "blog" | "stranica") {
  const toastId = toast.loading("Otpremanje slike...");

  try {
    const formData = new FormData();
    formData.append("file", file);
    if (source) formData.append("collection", source === "blog" ? "Blog" : "Stranica");

    const { uploadMediaAction } = await import("@/app/(server)/actions/cms-media");
    const result = await uploadMediaAction(formData);

    if (!result.success || !result.data?.url) {
      throw new Error(result.error || "Upload failed");
    }

    editor.chain().focus().setImage({ src: result.data.url }).run();
    toast.dismiss(toastId);
    toast.success("Slika je otpremljena.");
  } catch (err) {
    toast.dismiss(toastId);
    toast.error("Greška pri otpremanju slike.");
    console.error("[CMS Image Upload]", err);
  }
}
