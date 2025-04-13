/**
 * Format a number as currency
 * 
 * @param amount The amount to format
 * @param currencyCode The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

/**
 * Format a date string
 * 
 * @param dateString The date string to format
 * @param format The format to use (default: short)
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString; // Return original string if invalid date
  }

  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'short',
    day: 'numeric'
  };
  
  if (format === 'long') {
    options.weekday = 'long';
    options.month = 'long';
  }

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Format a time string (typically for chat messages)
 * 
 * @param dateString The date string to format
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return ''; // Return empty string if invalid date
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format a number as percentage
 * 
 * @param value The value to format as percentage
 * @param digitsAfterDecimal The number of digits after decimal (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, digitsAfterDecimal: number = 2): string => {
  return `${(value * 100).toFixed(digitsAfterDecimal)}%`;
};

/**
 * Format a number with thousands separators
 * 
 * @param number The number to format
 * @returns Formatted number string with thousands separators
 */
export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat().format(number);
};

/**
 * Format a date in a relative format (e.g., "2 hours ago", "yesterday", etc.)
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return 'yesterday';
    }
    return `${diffInDays} days ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
