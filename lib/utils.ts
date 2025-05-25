import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfWeek, addDays, getISOWeek, endOfYear, isSameYear } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWeekNumber(date: Date): number {
  return getISOWeek(date);
}

export function getWeeksInYear(year: number): number {
  // Get week 52's range
  const week52End = getWeekRange(52, year).end;
  const yearEnd = endOfYear(new Date(year, 0, 1));
  
  // If after week 52 we still have days in this year, we need week 53
  const dayAfterWeek52 = addDays(week52End, 1);
  return isSameYear(dayAfterWeek52, yearEnd) ? 53 : 52;
}

export function getWeekRange(week: number, year: number): { start: Date; end: Date } {
  // Get the first Monday of the year
  const firstDayOfYear = new Date(year, 0, 1);
  const firstMonday = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
  
  // Calculate the start date by adding the required weeks
  const start = addDays(firstMonday, (week - 1) * 7);
  
  // Add 6 days to get to Sunday
  const end = addDays(start, 6);
  
  return { start, end };
}

export function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("tiktok.com") ||
      urlObj.hostname.includes("instagram.com")
    );
  } catch {
    return false;
  }
}
