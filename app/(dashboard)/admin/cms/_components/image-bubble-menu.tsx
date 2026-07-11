"use client";

import { useState, useCallback, useRef } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import { MediaLibraryDialog } from "@/app/(dashboard)/admin/media/_components/media-library-dialog";

interface ImageBubbleMenuProps {
  editor: Editor;
  dict?: Record<string, unknown>;
}

export function ImageBubbleMenu({ editor, dict }: ImageBubbleMenuProps) {
  const [altValue, setAltValue] = useState("");
  const altTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isImageSelected = editor.isActive("image");

  const handleAltChange = useCallback(
    (value: string) => {
      setAltValue(value);
      if (altTimerRef.current) clearTimeout(altTimerRef.current);
      altTimerRef.current = setTimeout(() => {
        editor.chain().focus().updateAttributes("image", { alt: value }).run();
      }, 400);
    },
    [editor],
  );

  const handleRemove = useCallback(() => {
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  const handleReplace = useCallback(
    (url: string, altText?: string) => {
      editor
        .chain()
        .focus()
        .updateAttributes("image", { src: url, alt: altText || altValue || "" })
        .run();
    },
    [editor, altValue],
  );

  // Read current alt on selection change
  // Using a simple approach: re-read from editor state when menu opens
  const currentAlt =
    isImageSelected && editor.state.selection
      ? editor.state.doc.nodeAt(editor.state.selection.from)?.attrs?.alt || ""
      : "";

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="image-bubble-menu"
      shouldShow={({ editor: ed }) => ed.isActive("image")}
      className="bg-background border-border flex items-center gap-1 rounded-lg border p-1.5 shadow-lg"
    >
      {/* Alt text input */}
      <div className="flex items-center gap-1">
        <Input
          defaultValue={currentAlt}
          placeholder="Alt tekst..."
          onChange={(e) => handleAltChange(e.target.value)}
          className="h-7 w-[140px] text-xs"
        />
      </div>

      {/* Replace */}
      <MediaLibraryDialog
        dict={dict || {}}
        onInsert={handleReplace}
        trigger={
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
            <Icon name="photo_library" className="size-3" />
            Zameni
          </Button>
        }
      />

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        className="text-destructive hover:text-destructive h-7 gap-1 px-2 text-xs"
      >
        <Icon name="delete" className="size-3" />
        Obriši
      </Button>
    </BubbleMenu>
  );
}
