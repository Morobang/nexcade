import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to readable string
 * @param date - Date string or Date object
 * @param format - 'short' | 'long' | 'time' (default: 'long')
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'time' = 'long'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  return new Intl.DateTimeFormat('en-ZA', options[format]).format(d);
}

/**
 * Format a number as ZAR currency
 * @param amount - Amount in rands
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate time remaining until a date
 * @param endDate - The date to count down to
 * @returns Object with days, hours, minutes, seconds
 */
export function calculateTimeLeft(endDate: string | Date) {
  const now = new Date().getTime();
  const target = new Date(endDate).getTime();
  const difference = target - now;

  if (difference < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
}

/**
 * Format time left as a readable string
 * @param endDate - The date to count down to
 */
export function formatTimeLeft(endDate: string | Date): string {
  const time = calculateTimeLeft(endDate);

  if (time.isExpired) {
    return 'Event started';
  }

  if (time.days > 0) {
    return `${time.days}d ${time.hours}h left`;
  }

  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m left`;
  }

  if (time.minutes > 0) {
    return `${time.minutes}m ${time.seconds}s left`;
  }

  return `${time.seconds}s left`;
}

/**
 * Calculate win rate percentage
 * @param wins - Number of wins
 * @param total - Total matches played
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

/**
 * Slugify a string for URLs
 * @param str - String to slugify
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to a max length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Generate initials from a name
 * @param name - Full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 */
export function isPast(date: string | Date): boolean {
  return new Date(date).getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 */
export function isFuture(date: string | Date): boolean {
  return new Date(date).getTime() > new Date().getTime();
}

/**
 * Format a phone number
 * @param phone - Phone number string
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+27${cleaned.slice(1)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('27')) {
    return `+${cleaned}`;
  }
  return phone;
}

/**
 * Validate email address
 * @param email - Email to validate
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep/delay function for async operations
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
