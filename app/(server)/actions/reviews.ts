"use server";

import { prisma } from "@/server/lib/prisma";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { requireSuperAdmin, requireAdmin } from "@/server/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const submitReviewSchema = z.object({
  facilityId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

/**
 * ⭐ Submit a review for a facility (authenticated user)
 * One review per user per facility (enforced by unique constraint)
 */
export async function submitReviewAction(
  facilityId: string,
  rating: number,
  title?: string,
  content?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAdmin();

    const validated = submitReviewSchema.parse({ facilityId, rating, title, content });

    // Verify facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: validated.facilityId },
      select: { id: true, slug: true },
    });

    if (!facility) {
      return { success: false, error: "Objekat nije pronađen." };
    }

    const review = await prisma.review.create({
      data: {
        facilityId: validated.facilityId,
        userId: user.id,
        rating: validated.rating,
        title: validated.title || null,
        content: validated.content || null,
        isApproved: false,
      },
    });

    revalidatePath(`/${facility.slug}`, "layout");
    return { success: true, data: { id: review.id } };
  } catch (error) {
    return handleServerActionError(error, "submitReview");
  }
}

/**
 * ✅ Approve a review (Super Admin only)
 */
export async function approveReviewAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const review = await prisma.review.findUnique({
      where: { id },
      include: { facility: { select: { slug: true } } },
    });

    if (!review) {
      return { success: false, error: "Recenzija nije pronađena." };
    }

    await prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    revalidatePath("/admin/cms/reviews");
    revalidatePath(`/${review.facility.slug}`, "layout");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "approveReview");
  }
}

/**
 * 🗑️ Delete a review (Super Admin only)
 */
export async function deleteReviewAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const review = await prisma.review.findUnique({
      where: { id },
      include: { facility: { select: { slug: true } } },
    });

    if (!review) {
      return { success: false, error: "Recenzija nije pronađena." };
    }

    await prisma.review.delete({
      where: { id },
    });

    revalidatePath("/admin/cms/reviews");
    revalidatePath(`/${review.facility.slug}`, "layout");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "deleteReview");
  }
}

/**
 * 📋 Get all approved reviews for a facility (public)
 */
export async function getFacilityReviewsAction(facilityId: string) {
  try {
    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { facilityId, isApproved: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.review.aggregate({
        where: { facilityId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "getFacilityReviews");
  }
}

/**
 * 👤 Get current user's reviews
 */
export async function getMyReviewsAction() {
  try {
    const user = await requireAdmin();

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        facility: { select: { id: true, name: true, slug: true, city: true } },
      },
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return handleServerActionError(error, "getMyReviews");
  }
}

/**
 * 📋 Get all reviews (admin: pending + approved)
 */
export async function getAllReviewsAction() {
  try {
    await requireSuperAdmin();

    const reviews = await prisma.review.findMany({
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return handleServerActionError(error, "getAllReviews");
  }
}
