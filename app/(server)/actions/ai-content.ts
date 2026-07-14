"use server";

import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";

interface AIContentResult {
  title: string;
  content: string;
  excerpt: string;
}

export async function generateContentAction(topic: string): Promise<ActionResult<AIContentResult>> {
  try {
    await requireAdmin();

    if (!topic || topic.trim().length < 2) {
      return { success: false, error: "Enter a topic (at least 2 characters)." };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey) {
      return { success: false, error: "OPENAI_API_KEY is not set. Add it to your .env file." };
    }

    const prompt = `Napiši blog objavu na srpskom jeziku na temu: "${topic}".

Format odgovora (čist JSON, bez markdown-a):
{
  "title": "Naslov objave (max 60 karaktera)",
  "content": "<h2>Uvod</h2><p>Dobrodošli...</p><h2>...</h2><p>...</p>",
  "excerpt": "Kratak opis objave (max 160 karaktera)"
}

Content treba da bude HTML formatiran, sa relevantnim h2, p, ul, ol tagovima.
Naslov treba da bude SEO-optimizovan i privlačan.
Excerpt treba da sadrži ključne reči i bude zanimljiv za čitaoca.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ti si iskusni SEO copywriter za Splashdeals.rs, sajt za bazene i spa u Srbiji. Pišeš na srpskom jeziku, koristeći prirodan i privlačan stil.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        success: false,
        error: `AI API error (${response.status}): ${errBody || response.statusText}`,
      };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return { success: false, error: "AI did not return any content." };
    }

    // Try to parse JSON from the response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback: use raw response
      return {
        success: true,
        data: {
          title: topic,
          content: rawContent,
          excerpt: rawContent.replace(/<[^>]*>/g, "").slice(0, 155),
        },
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as AIContentResult;
      return {
        success: true,
        data: {
          title: parsed.title || topic,
          content: parsed.content || rawContent,
          excerpt: parsed.excerpt || rawContent.replace(/<[^>]*>/g, "").slice(0, 155),
        },
      };
    } catch {
      return {
        success: true,
        data: {
          title: topic,
          content: rawContent,
          excerpt: rawContent.replace(/<[^>]*>/g, "").slice(0, 155),
        },
      };
    }
  } catch (error) {
    return handleServerActionError(error, "cms/generateContent");
  }
}
