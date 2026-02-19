/**
 * Utility functions for formatting data
 */

/**
 * Currency symbol mapping
 */
const currencySymbols: { [key: string]: string } = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
};

/**
 * Get currency symbol for a currency code
 * @param currencyCode - ISO currency code (NGN, USD, etc.)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
    return currencySymbols[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format price with currency symbol based on currency code
 * @param price - Price amount (in smallest unit, e.g., kobo for NGN)
 * @param currencyCode - ISO currency code (NGN, USD, GBP, etc.)
 * @returns Formatted price string with currency symbol
 */
export const formatPrice = (price: number, currencyCode: string = 'NGN'): string => {
    const symbol = getCurrencySymbol(currencyCode);
    const amount = Math.floor(price);
    return `${symbol}${amount.toLocaleString('en-US')}`;
};

/**
 * Format price to integer (smallest unit)
 * Removes any decimal places
 * @param price - Price amount  
 * @returns Integer price
 */
export const formatPriceInt = (price: number): number => {
    return Math.floor(price);
};
