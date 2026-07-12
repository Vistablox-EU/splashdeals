"use client";

import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface ContentBlocksPanelProps {
  editor: Editor | null;
}

export function ContentBlocksPanel({ editor }: ContentBlocksPanelProps) {
  const insertBlockquote = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        '<blockquote class="cms-blockquote border-l-4 border-blue-500 bg-blue-50 pl-4 italic text-gray-700 my-4"><p>Tekst citata...</p></blockquote>',
      )
      .run();
  };

  const insertImageTextRow = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        '<div class="cms-image-text flex flex-col md:flex-row gap-4 my-4 items-center"><div class="md:w-1/2"><img src="https://placehold.co/600x400?text=Slika" alt="Opis slike" class="w-full rounded-lg" /></div><div class="md:w-1/2"><p class="text-gray-700">Tekst pored slike...</p></div></div>',
      )
      .run();
  };

  const insertCtaButton = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        '<div class="cms-cta text-center my-6"><a href="#" class="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors no-underline">Pogledaj ponudu</a></div>',
      )
      .run();
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Blokovi</h3>
      <p className="text-muted-foreground text-xs">Ubaci gotove blokove u editor</p>
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={insertBlockquote}
        >
          <Icon name="format_quote" className="size-4" />
          Blok citat
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={insertImageTextRow}
        >
          <Icon name="view_column" className="size-4" />
          Slika + tekst
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={insertCtaButton}
        >
          <Icon name="ads_click" className="size-4" />
          CTA dugme
        </Button>
      </div>
    </div>
  );
}
