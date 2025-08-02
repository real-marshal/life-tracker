import { Duration, formatDuration, startOfDay, subDays } from 'date-fns'

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

// THINK ABOUT TIMEZONES AGAIN

// use today/yesterday, then weekdays before falling back to date strings
function formatDateSmart(date: Date) {
  const isInTheLast7Days = date >= startOfDay(subDays(new Date(), 7))

  if (isToday(date)) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !uses24HourClock(),
    })
  }

  if (isMessageSentInTheLast7Days) {
    return format(date, 'E')
  }

  if (isThisYear(date)) {
    return date.toLocaleString([], { day: 'numeric', month: 'short' })
  }
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
