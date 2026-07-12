/** @consumer external-agent -- called by external tools/agents via API key. Admin UI uses Server Actions instead. */
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/server/lib/api-key-auth";
import { requireSuperAdmin } from "@/server/lib/auth-guards";
import { sendEmail } from "@/server/lib/email";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.string().email("Neispravna email adresa"),
  subject: z.string().min(1, "Naslov je obavezan").max(200, "Naslov je predugačak"),
  text: z.string().min(1, "Sadržaj je obavezan"),
  html: z.string().optional(),
});

/**
 * 📧 Agent Email API — Send email via configured SMTP
 *
 * Allows Paperclip agents to send emails through the platform's
 * existing SMTP configuration. Authenticated via x-api-key header.
 *
 * POST /api/admin/send-email
 * Body: { to: string, subject: string, text: string, html?: string }
 */
export async function POST(request: Request) {
  try {
    // Authenticate via API key or session
    await authenticateRequest(request).catch(() => requireSuperAdmin());

    // Validate payload
    const json = await request.json();
    const validated = sendEmailSchema.parse(json);

    // Send email
    await sendEmail(validated.to, validated.subject, validated.html || validated.text || "");

    return NextResponse.json({
      success: true,
      message: `Email poslat na ${validated.to}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Proverite unete podatke.",
          fieldErrors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Greška pri slanju emaila";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
