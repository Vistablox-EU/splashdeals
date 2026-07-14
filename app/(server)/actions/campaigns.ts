"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { revalidatePath } from "next/cache";

// ─── Types ─────────────────────────────────────────────

export interface CampaignData {
  id: string;
  name: string;
  code: string | null;
  discountPercent: number;
  minPurchaseAmount: number | null;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  facilityRestrictions: { facilityId: string }[];
}

export interface CampaignFormData {
  name: string;
  code: string;
  discountPercent: number;
  minPurchaseAmount?: number | null;
  validFrom: string;
  validTo: string;
  usageLimit?: number | null;
  facilityIds?: string[];
}

function serializeCampaign(c: any): CampaignData {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    discountPercent: Number(c.discountPercent),
    minPurchaseAmount: c.minPurchaseAmount ? Number(c.minPurchaseAmount) : null,
    validFrom: c.validFrom instanceof Date ? c.validFrom.toISOString() : c.validFrom,
    validTo: c.validTo instanceof Date ? c.validTo.toISOString() : c.validTo,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    facilityRestrictions: (c.facilityRestrictions || []).map((fr: { facilityId: string }) => ({
      facilityId: fr.facilityId,
    })),
  };
}

// ─── List ──────────────────────────────────────────────

export async function listCampaignsAction(): Promise<ActionResult<CampaignData[]>> {
  try {
    await requireAdmin();

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        facilityRestrictions: true,
      },
    });

    return { success: true, data: campaigns.map(serializeCampaign) };
  } catch (error) {
    return handleServerActionError(error, "campaigns/listCampaigns");
  }
}

// ─── Get single ────────────────────────────────────────

export async function getCampaignAction(id: string): Promise<ActionResult<CampaignData>> {
  try {
    await requireAdmin();

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        facilityRestrictions: true,
      },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found." };
    }

    return { success: true, data: serializeCampaign(campaign) };
  } catch (error) {
    return handleServerActionError(error, "campaigns/getCampaign");
  }
}

// ─── Create ────────────────────────────────────────────

export async function createCampaignAction(
  data: CampaignFormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    if (!data.name.trim()) {
      return { success: false, error: "Campaign name is required." };
    }
    if (!data.code.trim()) {
      return { success: false, error: "Campaign code is required." };
    }
    if (data.discountPercent <= 0 || data.discountPercent > 100) {
      return { success: false, error: "Discount must be between 1 and 100." };
    }
    if (!data.validFrom || !data.validTo) {
      return { success: false, error: "Validity dates are required." };
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        discountPercent: data.discountPercent,
        minPurchaseAmount: data.minPurchaseAmount ?? null,
        validFrom: new Date(data.validFrom),
        validTo: new Date(data.validTo),
        usageLimit: data.usageLimit ?? null,
        facilityRestrictions: data.facilityIds?.length
          ? {
              create: data.facilityIds.map((facilityId) => ({ facilityId })),
            }
          : undefined,
      },
    });

    revalidatePath("/admin/cms/campaigns");
    return { success: true, data: { id: campaign.id } };
  } catch (error) {
    return handleServerActionError(error, "campaigns/createCampaign");
  }
}

// ─── Update ────────────────────────────────────────────

export async function updateCampaignAction(
  id: string,
  data: CampaignFormData & { isActive?: boolean },
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Campaign not found." };
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
    if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
    if (data.minPurchaseAmount !== undefined)
      updateData.minPurchaseAmount = data.minPurchaseAmount ?? null;
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo !== undefined) updateData.validTo = new Date(data.validTo);
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update campaign
    await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    // Update facility restrictions if provided
    if (data.facilityIds !== undefined) {
      // Delete existing
      await prisma.campaignFacility.deleteMany({ where: { campaignId: id } });
      // Create new
      if (data.facilityIds.length > 0) {
        await prisma.campaignFacility.createMany({
          data: data.facilityIds.map((facilityId) => ({ campaignId: id, facilityId })),
        });
      }
    }

    revalidatePath("/admin/cms/campaigns");
    revalidatePath(`/admin/cms/campaigns/${id}`);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "campaigns/updateCampaign");
  }
}

// ─── Delete ────────────────────────────────────────────

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Campaign not found." };
    }

    await prisma.campaign.delete({ where: { id } });

    revalidatePath("/admin/cms/campaigns");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "campaigns/deleteCampaign");
  }
}

// ─── Validate promo code (checkout-facing) ─────────────

export async function validatePromoCodeAction(
  code: string,
  facilityId?: string,
  totalAmount?: number,
): Promise<
  ActionResult<
    { valid: true; discountPercent: number; campaignId: string } | { valid: false; error: string }
  >
> {
  try {
    if (!code.trim()) {
      return { success: true, data: { valid: false, error: "Enter a promo code." } };
    }

    const campaign = await prisma.campaign.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { facilityRestrictions: true },
    });

    if (!campaign) {
      return { success: true, data: { valid: false, error: "Invalid or expired code." } };
    }

    // Check if active
    if (!campaign.isActive) {
      return { success: true, data: { valid: false, error: "Code is no longer active." } };
    }

    const now = new Date();

    // Check validFrom
    if (campaign.validFrom > now) {
      return { success: true, data: { valid: false, error: "Code is not yet active." } };
    }

    // Check validTo
    if (campaign.validTo < now) {
      return { success: true, data: { valid: false, error: "Code has expired." } };
    }

    // Check usage limit
    if (campaign.usageLimit !== null && campaign.usedCount >= campaign.usageLimit) {
      return {
        success: true,
        data: { valid: false, error: "Code has reached its maximum usage." },
      };
    }

    // Check min purchase amount
    if (totalAmount !== undefined && campaign.minPurchaseAmount !== null) {
      if (totalAmount < Number(campaign.minPurchaseAmount)) {
        return {
          success: true,
          data: {
            valid: false,
            error: `Minimum amount for this code is ${Number(campaign.minPurchaseAmount)} RSD.`,
          },
        };
      }
    }

    // Check facility restrictions
    if (facilityId && campaign.facilityRestrictions.length > 0) {
      const isAllowed = campaign.facilityRestrictions.some((fr) => fr.facilityId === facilityId);
      if (!isAllowed) {
        return {
          success: true,
          data: { valid: false, error: "Code is not valid for the selected facility." },
        };
      }
    }

    return {
      success: true,
      data: {
        valid: true,
        discountPercent: Number(campaign.discountPercent),
        campaignId: campaign.id,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "campaigns/validatePromoCode");
  }
}

// ─── Increment campaign usage ──────────────────────────

export async function incrementCampaignUsageAction(campaignId: string): Promise<ActionResult> {
  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { usedCount: { increment: 1 } },
    });

    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "campaigns/incrementCampaignUsage");
  }
}
