"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";

type TicketInfo = {
  id: string;
  qrHash: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  expiryDate: Date;
  holderName: string | null;
  ticketPrice: {
    label: string | null;
    price: number;
    ticketType: {
      title: string;
      category: {
        title: string;
        facility: {
          id: string;
          name: string;
          slug: string;
          city: string;
        };
      };
    };
  };
  transaction: {
    id: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
  };
};

/**
 * 🔍 Verify a ticket by its QR hash
 */
export async function verifyTicketAction(hash: string): Promise<ActionResult<TicketInfo>> {
  try {
    const ticket = await prisma.issuedTicket.findUnique({
      where: { qrHash: hash },
      include: {
        ticketPrice: {
          include: {
            ticketType: {
              include: {
                category: {
                  include: {
                    facility: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        city: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        transaction: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    return {
      success: true,
      data: {
        id: ticket.id,
        qrHash: ticket.qrHash,
        status: ticket.status,
        usageCount: ticket.usageCount,
        usageLimit: ticket.usageLimit,
        expiryDate: ticket.expiryDate,
        holderName: ticket.holderName,
        ticketPrice: {
          label: ticket.ticketPrice.label,
          price: Number(ticket.ticketPrice.price),
          ticketType: {
            title: ticket.ticketPrice.ticketType.title,
            category: {
              title: ticket.ticketPrice.ticketType.category.title,
              facility: ticket.ticketPrice.ticketType.category.facility,
            },
          },
        },
        transaction: {
          id: ticket.transaction.id,
          totalAmount: Number(ticket.transaction.totalAmount),
          currency: ticket.transaction.currency,
          createdAt: ticket.transaction.createdAt,
        },
      },
    };
  } catch (error) {
    return handleServerActionError(error, "verifyTicket");
  }
}

/**
 * ✅ Mark a ticket as used (check-in)
 */
export async function useTicketAction(
  hash: string,
): Promise<ActionResult<{ id: string; usageCount: number; usageLimit: number; status: string }>> {
  try {
    const ticket = await prisma.issuedTicket.findUnique({
      where: { qrHash: hash },
    });

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    if (ticket.status === "EXPIRED") {
      return { success: false, error: "Ticket has expired." };
    }

    if (ticket.usageCount >= ticket.usageLimit) {
      return { success: false, error: "Ticket has already been used (maximum entries reached)." };
    }

    const newUsageCount = ticket.usageCount + 1;
    const newStatus = newUsageCount >= ticket.usageLimit ? "USED" : ticket.status;

    const updated = await prisma.issuedTicket.update({
      where: { qrHash: hash },
      data: {
        usageCount: newUsageCount,
        status: newStatus,
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        usageCount: updated.usageCount,
        usageLimit: updated.usageLimit,
        status: updated.status,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "useTicket");
  }
}
