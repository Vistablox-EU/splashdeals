"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Valid email is required"),
  source: z.string().optional().default("footer"),
});

interface SubscriberState {
  success: boolean;
  message: string;
}

export async function subscribeToNewsletter(
  prevState: SubscriberState | null,
  formData: FormData,
): Promise<SubscriberState> {
  try {
    const email = formData.get("email")?.toString() || "";
    const source = formData.get("source")?.toString() || "footer";

    const validated = subscribeSchema.safeParse({ email, source });

    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0].message,
      };
    }

    // Upsert — if they already subscribed, just re-activate
    await prisma.subscriber.upsert({
      where: { email: validated.data.email },
      update: { active: true },
      create: {
        email: validated.data.email,
        source: validated.data.source,
      },
    });

    return {
      success: true,
      message: "You're in! 🌊",
    };
  } catch (error) {
    console.error("📧 Newsletter subscribe error:", error);
    return {
      success: false,
      message: "Subscription failed. Please try again.",
    };
  }
}
