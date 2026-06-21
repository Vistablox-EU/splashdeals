import { NextRequest, NextResponse } from "next/server";
// import { PKPass } from "passkit-generator";
import { prisma } from "@/server/lib/prisma";



/**
 * Apple Wallet Pass Generator
 * Logic: Resolves the IssuedTicket (Purchased Asset) by qrHash
 * and generates a .pkpass file for user's wallet.
 */
export async function GET(request: NextRequest) {
  // Guard against Next.js passing undefined during strict static build trace
  if (!request || !request.nextUrl) {
    return NextResponse.json({ error: "Static Build Execution" }, { status: 400 });
  }

  const qrHash = request.nextUrl.searchParams.get("qrHash");

  if (!qrHash) {
    return NextResponse.json({ error: "Missing qrHash" }, { status: 400 });
  }

  try {
    const issuedTicket = await prisma.issuedTicket.findUnique({
      where: { qrHash },
      include: {
        ticketPrice: {
          include: {
            ticketType: {
              include: {
                category: {
                  include: { facility: true }
                }
              }
            }
          }
        },
      },
    });

    if (!issuedTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isMissingCerts = !process.env.APPLE_WWDR_CERT;
    
    if (isMissingCerts) {
      console.warn("Generating Mock PassKit without Apple Certificates for Developer Feedback.");
      return new NextResponse(
        JSON.stringify({
           mock_success: true,
           message: "Placeholder for the binary .pkpass file. Real certificates required.",
           ticketDataExtracted: {
             qrHash: issuedTicket.qrHash,
             title: issuedTicket.ticketPrice?.ticketType?.title || "Ticket",
             facility: issuedTicket.ticketPrice?.ticketType?.category?.facility.name || "Facility"
           }
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return NextResponse.json({ error: "Certificates not configured" }, { status: 501 });
  } catch (error) {
    console.error("PassKit Generation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
