"use client";

import { useCallback, useRef, useEffect, useState } from "react";
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
import { ImageBubbleMenu } from "./image-bubble-menu";
import { ContentBlocksPanel } from "./content-blocks-panel";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  source?: "blog" | "stranica";
  dict?: Record<string, unknown>;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Počni da pišeš...",
  minHeight = 400,
  source,
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

  // Register image upload plugin (drag-drop / paste) — pass source for collection tagging
  useEffect(() => {
    if (!editor) return;
    const plugin = createImageUploadPlugin(editor, source);
    editor.registerPlugin(plugin);
    return () => {
      try {
        editor.unregisterPlugin("image-upload");
      } catch {}
    };
  }, [editor, source]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border">
      <Toolbar editor={editor} dict={dict} source={source} />
      <div className="border-b px-2 py-1.5">
        <ContentBlocksPanel editor={editor} />
      </div>
      <ImageBubbleMenu editor={editor} dict={dict} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  dict,
  source,
}: {
  editor: Editor;
  dict?: Record<string, unknown>;
  source?: "blog" | "stranica";
}) {
  const t = (dict as Record<string, any>) || {};
  const editorUploadError = t.editor_upload_error;
  const editorUploadSuccess = t.editor_upload_success;
  const editorUploading = t.editor_uploading;
  const linkUrlRef = useRef<HTMLInputElement>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingAltText, setPendingAltText] = useState("");
  const altInputRef = useRef<HTMLInputElement>(null);

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

      // Upload via media library action (WebP + resize + cache)
      const formData = new FormData();
      formData.append("file", file);
      if (source) formData.append("collection", source === "blog" ? "Blog" : "Stranica");

      const toastId = toast.loading(editorUploading || "Otpremanje slike...");
      try {
        const { uploadMediaAction } = await import("@/app/(server)/actions/cms-media");
        const res = await uploadMediaAction(formData);
        if (res.success && res.data?.url) {
          toast.dismiss(toastId);
          toast.success(editorUploadSuccess || "Slika je otpremljena.");
          setPendingImageUrl(res.data.url);
          setPendingAltText("");
          setTimeout(() => altInputRef.current?.focus(), 150);
        } else {
          toast.dismiss(toastId);
          toast.error(res.error || editorUploadError || "Greška pri otpremanju slike.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        toast.error(editorUploadError || "Greška pri otpremanju slike.");
        console.error("[CMS Image Upload]", err);
      }
    };
    input.click();
  }, [source, editorUploadError, editorUploadSuccess, editorUploading]);

  const handleAltDialogConfirm = useCallback(() => {
    if (pendingImageUrl) {
      editor.chain().focus().setImage({ src: pendingImageUrl, alt: pendingAltText }).run();
    }
    setPendingImageUrl(null);
    setPendingAltText("");
  }, [editor, pendingImageUrl, pendingAltText]);

  const handleAltDialogSkip = useCallback(() => {
    if (pendingImageUrl) {
      editor.chain().focus().setImage({ src: pendingImageUrl, alt: "" }).run();
    }
    setPendingImageUrl(null);
    setPendingAltText("");
  }, [editor, pendingImageUrl]);

  const handleAltDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Dialog was dismissed (Escape / click outside) — insert without alt
        if (pendingImageUrl) {
          editor.chain().focus().setImage({ src: pendingImageUrl, alt: "" }).run();
        }
        setPendingImageUrl(null);
        setPendingAltText("");
      }
    },
    [editor, pendingImageUrl],
  );

  return (
    <TooltipProvider>
      <div className="bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon="undo"
          label={t.editor_undo || "Poništi"}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon="redo"
          label={t.editor_redo || "Ponovi"}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label={t.editor_bold || "Podebljano"}
        >
          <Icon name="bold" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label={t.editor_italic || "Kurziv"}
        >
          <Icon name="italic" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label={t.editor_strike || "Precrtano"}
        >
          <Icon name="strikethrough" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label={t.editor_h1 || "Naslov 1"}
        >
          <span className="text-xs font-bold">H1</span>
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label={t.editor_h2 || "Naslov 2"}
        >
          <span className="text-xs font-bold">H2</span>
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label={t.editor_h3 || "Naslov 3"}
        >
          <span className="text-xs font-bold">H3</span>
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label={t.editor_bullet_list || "Nenumerisana lista"}
        >
          <Icon name="list" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label={t.editor_ordered_list || "Numerisana lista"}
        >
          <Icon name="list_ordered" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Block */}
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label={t.editor_blockquote || "Citat"}
        >
          <Icon name="format_quote" className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label={t.editor_code || "Kod"}
        >
          <Icon name="code" className="size-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              aria-label={t.editor_link || "Link"}
            >
              <Icon name="link" className="size-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" side="bottom" align="start">
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium">
                {t.editor_link_url || "Link URL"}
              </p>
              <div className="flex gap-2">
                <Input ref={linkUrlRef} placeholder="https://..." className="h-8 text-xs" />
                <Button size="sm" onClick={setLink} className="h-8">
                  {t.editor_link_save || "Sačuvaj"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image — opens file picker */}
        <ToolbarButton onClick={addImage} icon="image" label={t.editor_image || "Slike"} />

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
            <ToolbarButton
              onClick={() => {}}
              icon="photo_library"
              label={t.editor_media_library || "Media biblioteka"}
            />
          }
        />
      </div>

      {/* Alt text prompt after Slike upload */}
      <AlertDialog open={!!pendingImageUrl} onOpenChange={handleAltDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.editor_alt_title || "Alt tekst za sliku"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.editor_alt_description ||
                "Dodaj opis slike koji će biti prikazan ako se slika ne učita. Ovo poboljšava pristupačnost i SEO."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            ref={altInputRef}
            value={pendingAltText}
            onChange={(e) => setPendingAltText(e.target.value)}
            placeholder={t.editor_alt_placeholder || "Opis slike..."}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAltDialogConfirm();
              }
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAltDialogSkip}>
              {t.editor_alt_skip || "Preskoči"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAltDialogConfirm}>
              {t.editor_alt_add || "Dodaj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
