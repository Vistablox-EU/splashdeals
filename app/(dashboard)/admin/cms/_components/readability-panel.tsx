"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

interface ReadabilityPanelProps {
  content?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function countSentences(text: string): number {
  if (!text) return 0;
  // Count sentences by sentence-ending punctuation
  const matches = text.match(/[.!?]+(\s|$)/g);
  return matches ? matches.length : 1;
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function countCharacters(text: string): number {
  if (!text) return 0;
  return text.replace(/\s/g, "").length;
}

function countParagraphs(html: string): number {
  if (!html) return 0;
  const matches = html.match(/<p[^>]*>/gi);
  return matches ? matches.length : 1;
}

function getAverageSentenceLength(wordCount: number, sentenceCount: number): number {
  if (sentenceCount === 0) return 0;
  return Math.round((wordCount / sentenceCount) * 10) / 10;
}

function getAverageWordLength(charCount: number, wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.round((charCount / wordCount) * 10) / 10;
}

function getAverageParagraphLength(wordCount: number, paragraphCount: number): number {
  if (paragraphCount === 0) return 0;
  return Math.round(wordCount / paragraphCount);
}

function getReadabilityLabel(avgSentenceLen: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (avgSentenceLen <= 0) return { label: "Nema sadržaja", color: "text-muted-foreground", bg: "bg-muted border-muted" };
  if (avgSentenceLen < 10) return { label: "Vrlo lako za čitanje", color: "text-green-600", bg: "bg-green-50 border-green-200" };
  if (avgSentenceLen < 15) return { label: "Lako za čitanje", color: "text-green-600", bg: "bg-green-50 border-green-200" };
  if (avgSentenceLen < 20) return { label: "Prosečna čitljivost", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" };
  if (avgSentenceLen < 25) return { label: "Teže za čitanje", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  return { label: "Vrlo teško za čitanje", color: "text-red-600", bg: "bg-red-50 border-red-200" };
}

export function ReadabilityPanel({ content }: ReadabilityPanelProps) {
  const { watch } = useFormContext();
  const contentHtml = content || watch("content") || "";

  const stats = useMemo(() => {
    const text = stripHtml(contentHtml);
    const wordCount = countWords(text);
    const sentenceCount = countSentences(text);
    const charCount = countCharacters(text);
    const paragraphCount = countParagraphs(contentHtml);

    const avgSentenceLen = getAverageSentenceLength(wordCount, sentenceCount);
    const avgWordLen = getAverageWordLength(charCount, wordCount);
    const avgParagraphLen = getAverageParagraphLength(wordCount, paragraphCount);

    const readability = getReadabilityLabel(avgSentenceLen);

    return {
      avgSentenceLen,
      avgWordLen,
      avgParagraphLen,
      wordCount,
      sentenceCount,
      paragraphCount,
      ...readability,
    };
  }, [contentHtml]);

  return (
    <div className="space-y-4">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        Čitljivost
      </h4>

      <div className={`rounded-lg border p-3 ${stats.bg}`}>
        <p className={`text-sm font-medium ${stats.color}`}>
          Čitljivost: {stats.label}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {stats.avgSentenceLen} reči po rečenici
        </p>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Prosečna dužina rečenice</span>
          <span className="font-medium">{stats.avgSentenceLen} reči</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Prosečna dužina reči</span>
          <span className="font-medium">{stats.avgWordLen} slova</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Prosečna dužina pasusa</span>
          <span className="font-medium">{stats.avgParagraphLen} reči</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ukupno reči</span>
          <span className="font-medium">{stats.wordCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Broj rečenica</span>
          <span className="font-medium">{stats.sentenceCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Broj pasusa</span>
          <span className="font-medium">{stats.paragraphCount}</span>
        </div>
      </div>
    </div>
  );
}
