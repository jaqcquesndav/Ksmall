// Type definitions for date-fns
// This is a comprehensive declaration file for date-fns

declare module 'date-fns' {
  // Basic date functions
  export function format(date: Date | number, format: string, options?: object): string;
  export function parse(dateString: string, formatString: string, referenceDate: Date | number, options?: object): Date;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function addYears(date: Date | number, amount: number): Date;
  export function subYears(date: Date | number, amount: number): Date;
  export function addHours(date: Date | number, amount: number): Date;
  export function subHours(date: Date | number, amount: number): Date;
  export function addMinutes(date: Date | number, amount: number): Date;
  export function subMinutes(date: Date | number, amount: number): Date;
  export function addSeconds(date: Date | number, amount: number): Date;
  export function subSeconds(date: Date | number, amount: number): Date;
  
  // Comparison functions
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isEqual(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function isSameYear(dateLeft: Date | number, dateRight: Date | number): boolean;
  
  // Date information functions
  export function getDay(date: Date | number): number;
  export function getMonth(date: Date | number): number;
  export function getYear(date: Date | number): number;
  export function getDate(date: Date | number): number;
  export function getHours(date: Date | number): number;
  export function getMinutes(date: Date | number): number;
  export function getSeconds(date: Date | number): number;
  
  // Formatting
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: object): string;
  export function formatDistanceToNow(date: Date | number, options?: object): string;
  export function formatRelative(date: Date | number, baseDate: Date | number, options?: object): string;
  
  // Other utilities
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfYear(date: Date | number): Date;
  export function endOfYear(date: Date | number): Date;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInMonths(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInYears(dateLeft: Date | number, dateRight: Date | number): number;
}