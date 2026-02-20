import { DISPLAY_TIMEZONE } from "./site";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: DISPLAY_TIMEZONE,
});

const yearFormatter = new Intl.DateTimeFormat("en-IN", {
  year: "numeric",
  timeZone: DISPLAY_TIMEZONE,
});

function toValidDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: "${value}". Expected a valid Date object or ISO string.`);
  }

  return date;
}

export function formatDate(value: Date | string): string {
  const date = toValidDate(value);
  return dateFormatter.format(date);
}

export const formatDisplayDate = formatDate;

export function getYearFromDate(value: Date | string): number {
  const date = toValidDate(value);
  return Number(yearFormatter.format(date));
}
