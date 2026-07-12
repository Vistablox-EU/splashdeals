"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

interface SEOScoringPanelProps {
  content?: string;
  slug?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function keywordInText(keyword: string, text: string): boolean {
  if (!keyword || !text) return false;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function countKeywordOccurrences(keyword: string, text: string): number {
  if (!keyword || !text) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function getFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return match ? stripHtml(match[1]) : "";
}

function getH1Text(html: string): string {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]) : "";
}

function extractAltTexts(html: string): string[] {
  const alts: string[] = [];
  const regex = /alt\s*=\s*"([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) alts.push(match[1]);
  }
  return alts;
}

interface ScoreItem {
  label: string;
  points: number;
  maxPoints: number;
}

export function SEOScoringPanel({ content, slug }: SEOScoringPanelProps) {
  const { watch } = useFormContext();
  const title = watch("title") || "";
  const focusKeyword = watch("focusKeyword") || "";
  const contentHtml = content || watch("content") || "";
  const currentSlug = slug || watch("slug") || "";

  const scores = useMemo<ScoreItem[]>(() => {
    if (!focusKeyword) return [];

    const text = stripHtml(contentHtml);
    const wordCount = countWords(text);
    const firstParagraph = getFirstParagraph(contentHtml);
    const h1Text = getH1Text(contentHtml);
    const altTexts = extractAltTexts(contentHtml);
    const totalOccurrences = countKeywordOccurrences(focusKeyword, text);
    const density = wordCount > 0 ? (totalOccurrences / wordCount) * 100 : 0;

    return [
      {
        label: "Ključna reč u naslovu",
        points: keywordInText(focusKeyword, title) ? 10 : 0,
        maxPoints: 10,
      },
      {
        label: "Ključna reč u prvom pasusu",
        points: keywordInText(focusKeyword, firstParagraph) ? 5 : 0,
        maxPoints: 5,
      },
      {
        label: "Ključna reč u H1 naslovu",
        points: keywordInText(focusKeyword, h1Text) ? 5 : 0,
        maxPoints: 5,
      },
      {
        label: "Ključna reč u URL-u",
        points: keywordInText(focusKeyword, currentSlug) ? 10 : 0,
        maxPoints: 10,
      },
      {
        label: "Ključna reč u alt tekstu",
        points: altTexts.some((alt) => keywordInText(focusKeyword, alt)) ? 5 : 0,
        maxPoints: 5,
      },
      {
        label: "Dužina sadržaja > 500 reči",
        points: wordCount > 500 ? 10 : 0,
        maxPoints: 10,
      },
      {
        label: "Gustina ključne reči 1-3%",
        points: density >= 1 && density <= 3 ? 10 : 0,
        maxPoints: 10,
      },
    ];
  }, [focusKeyword, title, contentHtml, currentSlug]);

  const totalScore = useMemo(() => scores.reduce((sum, s) => sum + s.points, 0), [scores]);
  const maxScore = 50;

  const scoreColor =
    totalScore < 20 ? "text-red-600" : totalScore <= 35 ? "text-yellow-600" : "text-green-600";
  const scoreBg =
    totalScore < 20 ? "bg-red-50 border-red-200" : totalScore <= 35 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200";

  return (
    <div className="space-y-4">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        SEO ocena
      </h4>

      <div className={`rounded-lg border p-3 ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Ukupna ocena</span>
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {totalScore}/{maxScore}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {totalScore < 20 && "Potrebna optimizacija"}
          {totalScore >= 20 && totalScore <= 35 && "Dobro, može bolje"}
          {totalScore > 35 && "Odlična SEO optimizacija"}
        </p>
      </div>

      {scores.length > 0 && (
        <div className="space-y-1.5">
          {scores.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex-1">{item.label}</span>
              <span
                className={
                  item.points === item.maxPoints
                    ? "text-green-600 font-medium"
                    : item.points > 0
                      ? "text-yellow-600 font-medium"
                      : "text-red-400"
                }
              >
                {item.points}/{item.maxPoints}
              </span>
            </div>
          ))}
        </div>
      )}

      {!focusKeyword && (
        <p className="text-muted-foreground text-xs">
          Unesi fokus ključnu reč iznad da vidiš SEO ocenu.
        </p>
      )}
    </div>
  );
}
