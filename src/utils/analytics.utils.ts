/**
 * Analytics Utility Functions
 * Helper functions for date ranges, timezone handling, and formatting
 */

import { addDays, startOfDay, endOfDay, startOfWeek, startOfMonth, addHours, format } from 'date-fns';

// Lagos is in WAT (West Africa Time) - UTC+1
const WAT_OFFSET_HOURS = 1;

/**
 * Date Range Utilities
 */

export interface DateRange {
    start: Date;
    end: Date;
}

export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
export type GroupBy = 'hour' | 'day' | 'week' | 'month';

/**
 * Get date range for common periods
 */
export function getDateRange(period: Period, customStart?: Date, customEnd?: Date): DateRange {
    const now = new Date();

    switch (period) {
        case 'today':
            return {
                start: startOfDay(now),
                end: endOfDay(now)
            };

        case 'yesterday':
            const yesterday = addDays(now, -1);
            return {
                start: startOfDay(yesterday),
                end: endOfDay(yesterday)
            };

        case 'week':
            return {
                start: addDays(now, -7),
                end: now
            };

        case 'month':
            return {
                start: addDays(now, -30),
                end: now
            };

        case 'year':
            return {
                start: addDays(now, -365),
                end: now
            };

        case 'custom':
            if (!customStart || !customEnd) {
                throw new Error('Custom period requires start and end dates');
            }
            return {
                start: startOfDay(customStart),
                end: endOfDay(customEnd)
            };

        default:
            return {
                start: addDays(now, -7),
                end: now
            };
    }
}

/**
 * Parse ISO date string to Date object
 */
export function parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
    }
    return date;
}

/**
 * Timezone Utilities (Lagos/WAT)
 */

/**
 * Convert UTC date to Lagos time
 */
export function toLagosTime(date: Date): Date {
    return addHours(date, WAT_OFFSET_HOURS);
}

/**
 * Get current time in Lagos
 */
export function getLagosNow(): Date {
    return toLagosTime(new Date());
}

/**
 * Format date for Lagos timezone
 */
export function formatLagosDate(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(toLagosTime(date), formatStr);
}

/**
 * Currency Formatting
 */

/**
 * Format amount in Nigerian Naira
 */
export function formatNaira(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format amount with decimal places
 */
export function formatNairaDecimal(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format amount as plain number (no currency symbol)
 */
export function formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Percentage Calculations
 */

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

/**
 * Business Hours (Lagos context)
 */

export const BUSINESS_HOURS = {
    start: 7,  // 7 AM
    end: 23    // 11 PM
};

export const PEAK_HOURS = {
    lunch: [12, 13, 14],        // 12 PM - 2 PM
    dinner: [18, 19, 20, 21]    // 6 PM - 9 PM
};

/**
 * Check if hour is during business hours
 */
export function isBusinessHours(hour: number): boolean {
    return hour >= BUSINESS_HOURS.start && hour <= BUSINESS_HOURS.end;
}

/**
 * Check if hour is during peak hours
 */
export function isPeakHour(hour: number): boolean {
    return PEAK_HOURS.lunch.includes(hour) || PEAK_HOURS.dinner.includes(hour);
}

/**
 * Get peak period name
 */
export function getPeakPeriod(hour: number): 'lunch' | 'dinner' | 'off-peak' | null {
    if (PEAK_HOURS.lunch.includes(hour)) return 'lunch';
    if (PEAK_HOURS.dinner.includes(hour)) return 'dinner';
    if (isBusinessHours(hour)) return 'off-peak';
    return null;
}

/**
 * Data Grouping Utilities
 */

/**
 * Group data by date format
 */
export function getGroupByFormat(groupBy: GroupBy): string {
    switch (groupBy) {
        case 'hour':
            return 'yyyy-MM-dd HH:00';
        case 'day':
            return 'yyyy-MM-dd';
        case 'week':
            return 'yyyy-ww';
        case 'month':
            return 'yyyy-MM';
        default:
            return 'yyyy-MM-dd';
    }
}

/**
 * Safe Division (avoid division by zero)
 */
export function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
    if (denominator === 0) return defaultValue;
    return numerator / denominator;
}

/**
 * Round to decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
}
