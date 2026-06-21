import { describe, it, expect } from 'vitest';
import { getDayType, resolveTicketsForDate, formatPrice, calculateMaxDiscount } from './pricing';
import { DayType, TimeSlot } from '@prisma/client';

describe('pricing utilities', () => {
  describe('getDayType', () => {
    it('identifies weekends correctly', () => {
      // 2026-05-23 is Saturday
      expect(getDayType(new Date('2026-05-23'))).toBe(DayType.WEEKEND);
      // 2026-05-24 is Sunday
      expect(getDayType(new Date('2026-05-24'))).toBe(DayType.WEEKEND);
    });

    it('identifies weekdays correctly', () => {
      // 2026-05-22 is Friday
      expect(getDayType(new Date('2026-05-22'))).toBe(DayType.WEEKDAY);
      // 2026-05-19 is Tuesday
      expect(getDayType(new Date('2026-05-19'))).toBe(DayType.WEEKDAY);
    });
  });

  describe('formatPrice', () => {
    it('formats price with RSD by default', () => {
      expect(formatPrice(1000)).toBe('1000 RSD');
    });

    it('formats price with custom currency', () => {
      expect(formatPrice(10, 'EUR')).toBe('10 EUR');
    });
  });

  describe('resolveTicketsForDate', () => {
    const mockTickets: any[] = [
      {
        id: '1',
        title: 'Weekday Pass',
        isActive: true,
        dayType: DayType.WEEKDAY,
        timeSlot: TimeSlot.FULL_DAY,
      },
      {
        id: '2',
        title: 'Weekend Pass',
        isActive: true,
        dayType: DayType.WEEKEND,
        timeSlot: TimeSlot.FULL_DAY,
      },
      {
        id: '3',
        title: 'All Day Pass',
        isActive: true,
        dayType: DayType.ALL,
        timeSlot: TimeSlot.FULL_DAY,
      },
      {
        id: '4',
        title: 'After 16h',
        isActive: true,
        dayType: DayType.ALL,
        timeSlot: TimeSlot.AFTER_16H,
      },
      {
        id: '5',
        title: 'Inactive',
        isActive: false,
        dayType: DayType.ALL,
        timeSlot: TimeSlot.FULL_DAY,
      }
    ];

    it('filters for weekday correctly', () => {
      const friday = new Date('2026-05-22');
      const resolved = resolveTicketsForDate(mockTickets, friday);
      expect(resolved.map(t => t.id)).toContain('1');
      expect(resolved.map(t => t.id)).toContain('3');
      expect(resolved.map(t => t.id)).not.toContain('2');
      expect(resolved.map(t => t.id)).not.toContain('5');
    });

    it('filters for weekend correctly', () => {
      const saturday = new Date('2026-05-23');
      const resolved = resolveTicketsForDate(mockTickets, saturday);
      expect(resolved.map(t => t.id)).toContain('2');
      expect(resolved.map(t => t.id)).toContain('3');
      expect(resolved.map(t => t.id)).not.toContain('1');
    });

    it('filters by time slot correctly', () => {
      const friday = new Date('2026-05-22');
      const resolved = resolveTicketsForDate(mockTickets, friday, TimeSlot.AFTER_16H);
      expect(resolved.map(t => t.id)).toContain('4');
      // Full day tickets should also be compatible according to the logic
      expect(resolved.map(t => t.id)).toContain('1'); 
      expect(resolved.map(t => t.id)).toContain('3');
    });
  });

  describe('calculateMaxDiscount', () => {
    it('returns 0 when tickets list is empty', () => {
      expect(calculateMaxDiscount([])).toBe(0);
    });

    it('calculates standard discount correctly and returns the highest one', () => {
      const tickets = [
        { isActive: true, price: 700, originalPrice: 1000 }, // 30% discount
        { isActive: true, price: 600, originalPrice: 1000 }, // 40% discount
        { isActive: true, price: 900, originalPrice: 1000 }, // 10% discount
      ];
      expect(calculateMaxDiscount(tickets)).toBe(40);
    });

    it('ignores inactive tickets', () => {
      const tickets = [
        { isActive: true, price: 700, originalPrice: 1000 }, // 30% discount
        { isActive: false, price: 500, originalPrice: 1000 }, // 50% discount (inactive)
      ];
      expect(calculateMaxDiscount(tickets)).toBe(30);
    });

    it('ignores tickets without originalPrice', () => {
      const tickets = [
        { isActive: true, price: 700, originalPrice: null },
        { isActive: true, price: 600, originalPrice: 1000 }, // 40% discount
      ];
      expect(calculateMaxDiscount(tickets)).toBe(40);
    });

    it('ignores tickets where originalPrice is less than or equal to price', () => {
      const tickets = [
        { isActive: true, price: 1000, originalPrice: 1000 }, // 0% discount
        { isActive: true, price: 1200, originalPrice: 1000 }, // Negative discount
        { isActive: true, price: 750, originalPrice: 1000 }, // 25% discount
      ];
      expect(calculateMaxDiscount(tickets)).toBe(25);
    });

    it('rounds to the nearest integer correctly', () => {
      const tickets = [
        { isActive: true, price: 666, originalPrice: 1000 }, // 33.4% -> 33%
        { isActive: true, price: 665, originalPrice: 1000 }, // 33.5% -> 34%
      ];
      expect(calculateMaxDiscount(tickets)).toBe(34);
    });

    it('safely handles string or decimal-like values', () => {
      const tickets = [
        { isActive: true, price: '700.00' as any, originalPrice: '1000.00' as any }, // 30%
      ];
      expect(calculateMaxDiscount(tickets)).toBe(30);
    });
  });
});
