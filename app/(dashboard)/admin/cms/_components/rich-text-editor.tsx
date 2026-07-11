"use client";

import { useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Icon } from "@/components/ui/Icon";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { createImageUploadPlugin } from "./image-upload-plugin";
import { MediaLibraryDialog } from "@/app/(dashboard)/admin/media/_components/media-library-dialog";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  dict?: Record<string, unknown>;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Počni da pišeš...",
  minHeight = 400,
  dict,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4",
          `min-h-[${minHeight}px]`,
        ].join(" "),
      },
    },
    immediatelyRender: false,
  });

  // Register image upload plugin (drag-drop / paste)
  useEffect(() => {
    if (!editor) return;
    const plugin = createImageUploadPlugin(editor);
    editor.registerPlugin(plugin);
    return () => {
      try {
        editor.unregisterPlugin("image-upload");
      } catch {}
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border">
      <Toolbar editor={editor} dict={dict} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, dict }: { editor: Editor; dict?: Record<string, unknown> }) {
  const linkUrlRef = useRef<HTMLInputElement>(null);

  const setLink = useCallback(() => {
    const url = linkUrlRef.current?.value;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Upload via server action
      const formData = new FormData();
      formData.append("file", file);

      try {
        const { uploadImageAction } = await import("@/app/(server)/actions/upload");
        const res = await uploadImageAction(formData);
        if (res.success && res.url) {
          editor.chain().focus().setImage({ src: res.url }).run();
        }
      } catch (err) {
        console.error("[CMS Image Upload]", err);
      }
    };
    input.click();
  }, [editor]);

  return (
    <TooltipProvider>
      <div className="bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon="undo"
          label="Poništi"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon="redo"
          label="Ponovi"
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Podebljano"
        >
          <Icon name="bold" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Kurziv"
        >
          <Icon name="italic" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Precrtano"
        >
          <Icon name="strikethrough" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Naslov 1"
        >
          <span className="text-xs font-bold">H1</span>
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Naslov 2"
        >
          <span className="text-xs font-bold">H2</span>
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Naslov 3"
        >
          <span className="text-xs font-bold">H3</span>
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Nenumerisana lista"
        >
          <Icon name="list" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Numerisana lista"
        >
          <Icon name="list_ordered" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Block */}
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Citat"
        >
          <Icon name="format_quote" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Kod"
        >
          <Icon name="code" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle size="sm" pressed={editor.isActive("link")} aria-label="Link">
              <Icon name="link" className="size-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom" align="start">
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium">Link URL</p>
              <div className="flex gap-2">
                <Input ref={linkUrlRef} placeholder="https://..." className="h-8 text-xs" />
                <Button size="sm" onClick={setLink} className="h-8">
                  Sačuvaj
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image — opens file picker */}
        <ToolbarButton onClick={addImage} icon="image" label="Slike" />

        {/* Media Library — opens dialog */}
        <MediaLibraryDialog
          dict={(dict?.media_library as Record<string, unknown>) || {}}
          onInsert={(url, altText) => {
            editor
              .chain()
              .focus()
              .setImage({ src: url, alt: altText || "" })
              .run();
          }}
          trigger={
            <ToolbarButton onClick={() => {}} icon="photo_library" label="Media biblioteka" />
          }
        />
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: string;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Icon name={icon} className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
