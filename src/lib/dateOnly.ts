const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DateOnlyParts {
  year: number;
  month: number;
  day: number;
}

export function parseDateOnly(value: string): DateOnlyParts {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid date-only value: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const cursor = new Date(Date.UTC(year, month - 1, day));

  if (
    cursor.getUTCFullYear() !== year ||
    cursor.getUTCMonth() !== month - 1 ||
    cursor.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

const pad2 = (value: number) => String(value).padStart(2, '0');

function formatParts(parts: DateOnlyParts): string {
  return `${String(parts.year).padStart(4, '0')}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/**
 * Formats an instant as the calendar date seen in the device timezone.
 * An explicit IANA timezone can be supplied in tests or server-side code.
 */
export function formatLocalDate(date: Date = new Date(), timeZone?: string): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid Date instance');
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
      .map((part) => [part.type, Number(part.value)]),
  ) as Partial<DateOnlyParts>;

  if (!values.year || !values.month || !values.day) {
    throw new Error('Could not format local calendar date');
  }

  return formatParts(values as DateOnlyParts);
}

export function todayLocalDate(): string {
  return formatLocalDate(new Date());
}

/** Date-only day arithmetic independent from timezone/DST. */
export function addDaysToDateOnly(value: string, days: number): string {
  const { year, month, day } = parseDateOnly(value);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return formatParts({
    year: cursor.getUTCFullYear(),
    month: cursor.getUTCMonth() + 1,
    day: cursor.getUTCDate(),
  });
}

/** Month arithmetic clamps dates such as Jan 31 to the last valid day of February. */
export function addMonthsToDateOnly(value: string, months: number): string {
  const { year, month, day } = parseDateOnly(value);
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = firstOfTarget.getUTCFullYear();
  const targetMonth = firstOfTarget.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();

  return formatParts({
    year: targetYear,
    month: targetMonth + 1,
    day: Math.min(day, lastDay),
  });
}

export function differenceInDateOnlyDays(later: string, earlier: string): number {
  const a = parseDateOnly(later);
  const b = parseDateOnly(earlier);
  const aMs = Date.UTC(a.year, a.month - 1, a.day);
  const bMs = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((aMs - bMs) / 86_400_000);
}

/** Converts YYYY-MM-DD to a local Date without the UTC parsing trap of new Date('YYYY-MM-DD'). */
export function dateOnlyToLocalDate(value: string, hour = 12): Date {
  const { year, month, day } = parseDateOnly(value);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}
