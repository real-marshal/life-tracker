import {
  Duration,
  format,
  formatDuration,
  isThisYear,
  isToday,
  isYesterday,
  startOfDay,
  subDays,
} from 'date-fns'

export interface DateTz {
  // date with tz applied, not converted to local time! (1 part of an ISO datetime string)
  date: Date
  // 2 part of an ISO datetime string
  tz: string
}

export function extractTzFromIso(date: string): string {
  if (date.at(-1) === 'Z') {
    return '+00:00'
  }

  const tz = date.match(/[+-]\d\d:\d\d$/)

  if (tz) {
    return tz[0]
  }

  throw new Error('Invalid date')
}

// creates a Date object from a UTC part of an ISO string without converting it into local time
export function extractDateFromIso(date: string): Date {
  if (date.at(-1) === 'Z') {
    return new Date(date)
  }

  const tz = date.match(/[+-]\d\d:\d\d$/)

  if (tz) {
    return new Date(date.slice(0, -tz[0].length))
  }

  throw new Error('Invalid date')
}

export function makeDateTz(isoDate: string): DateTz {
  return {
    date: extractDateFromIso(isoDate),
    tz: extractTzFromIso(isoDate),
  }
}

// shows y, m, d if duration is longer than a day, otherwise h, m, s
export function formatDurationShort(duration: Duration) {
  const format: (keyof Duration)[] =
    (duration.years ?? 0 > 0) || (duration.months ?? 0 > 0) || (duration.days ?? 0 > 0)
      ? ['years', 'months', 'days']
      : ['hours', 'minutes', 'seconds']

  return formatDuration(duration, { format })
    .replace(/ years?/, 'y')
    .replace(/ months?/, 'm')
    .replace(/ days?/, 'd')
    .replace(/ hours?/, 'h')
    .replace(/ minutes?/, 'm')
    .replace(/ seconds?/, 's')
}

// shows 2 values at most, depending on the length, in long format
export function formatDurationTwoLongValues(duration: Duration) {
  const format: (keyof Duration)[] =
    (duration.years ?? 0 > 0)
      ? ['years', 'months']
      : (duration.months ?? 0 > 0)
        ? ['months', 'days']
        : (duration.days ?? 0 > 0)
          ? ['days']
          : (duration.hours ?? 0 > 0)
            ? ['hours', 'minutes']
            : ['minutes', 'seconds']

  return formatDuration(duration, { format })
}

// use today/yesterday, then weekdays before falling back to date strings, excludes current year
// doesn't convert time into local and instead keeps it in the original timezone!
export function formatDateSmart({ date }: DateTz) {
  const isInTheLast7Days = date >= startOfDay(subDays(new Date(), 7))

  if (isToday(date)) {
    return 'Today'
  }

  if (isYesterday(date)) {
    return 'Yesterday'
  }

  if (isInTheLast7Days) {
    return format(date, 'EEEE')
  }

  if (isThisYear(date)) {
    return date.toLocaleString('en-US', { day: 'numeric', month: 'long' })
  }

  return date.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
