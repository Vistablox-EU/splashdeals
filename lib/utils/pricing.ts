import { DayType, TimeSlot } from "@prisma/client"
import { isWeekend } from "date-fns"

/**
 * 🌊 Pricing Engine Utility
 * Resolves the correct ticket based on date and slot constraints.
 */

export function getDayType(date: Date): DayType {
  if (isWeekend(date)) {
    return DayType.WEEKEND
  }
  return DayType.WEEKDAY
}

export interface TicketPriceData {
  id: string
  price: number
  label: string | null
  dayType: string | null
  timeSlot: string | null
  isActive: boolean
  displayOrder: number
  ticketTypeId: string
  saleStart: Date | null
  saleEnd: Date | null
}

/**
 * Filters a list of tickets to find the best match for a given date and time slot.
 */
export function resolveTicketsForDate(
  tickets: TicketPriceData[],
  date: Date,
  timeSlot: TimeSlot = TimeSlot.FULL_DAY
): TicketPriceData[] {
  const targetDayType = getDayType(date)
  
  return tickets.filter(ticket => {
    // 1. Check DayType compatibility
    const dayMatch = ticket.dayType === DayType.ALL || ticket.dayType === targetDayType
    
    // 2. Check TimeSlot compatibility
    const slotMatch = ticket.timeSlot === TimeSlot.FULL_DAY || ticket.timeSlot === timeSlot
    
    // 3. Check Active status and Sale window
    const now = new Date()
    const isSaleActive = (!ticket.saleStart || ticket.saleStart <= now) && 
                         (!ticket.saleEnd || ticket.saleEnd >= now)
    
    return ticket.isActive && dayMatch && slotMatch && isSaleActive
  })
}

/**
 * Formats a price with currency
 */
export function formatPrice(price: number | string, currency: string = "RSD"): string {
  return `${price} ${currency}`
}

/**
 * Calculates the maximum discount percentage among all active tickets of a facility.
 * Returns the highest percentage as a whole number (e.g. 35 for 35%), or 0 if no discount is found.
 */
export function calculateMaxDiscount(
  tickets: { isActive: boolean; price: number; originalPrice: number | null }[]
): number {
  if (!tickets || tickets.length === 0) return 0

  let maxDiscount = 0

  for (const ticket of tickets) {
    if (!ticket.isActive) continue

    const orig = Number(ticket.originalPrice)
    const cur = Number(ticket.price)

    if (orig && orig > 0 && cur && cur > 0 && orig > cur) {
      const discount = Math.round(((orig - cur) / orig) * 100)
      if (discount > maxDiscount) {
        maxDiscount = discount
      }
    }
  }

  return maxDiscount;
}

