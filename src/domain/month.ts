import { LOCALE } from '../config'

/** A calendar month as `YYYY-MM`. */
export type MonthKey = string

export function monthKeyOf(date: Date = new Date()): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** The month portion of an expense's `YYYY-MM-DD` date. */
export function monthKeyFromDate(isoDate: string): MonthKey {
  return isoDate.slice(0, 7)
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf()
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split('-').map(Number)
  return monthKeyOf(new Date(year, month - 1 + delta, 1))
}

export function isCurrentMonth(key: MonthKey): boolean {
  return key === currentMonthKey()
}

export function isFutureMonth(key: MonthKey): boolean {
  return key > currentMonthKey()
}

/** `count` consecutive month keys ending at (and including) `endKey`. */
export function lastMonths(endKey: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, index) => addMonths(endKey, index - count + 1))
}

export function daysInMonth(key: MonthKey): number {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

/** Days that have already happened in the month: the whole month if it is in
 *  the past, today's date if it is the current month, `0` if it is in the future. */
export function elapsedDaysInMonth(key: MonthKey): number {
  if (isFutureMonth(key)) return 0
  if (isCurrentMonth(key)) return new Date().getDate()
  return daysInMonth(key)
}

const longMonthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const shortMonthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short' })

function toDate(key: MonthKey): Date {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

export function formatMonthLong(key: MonthKey): string {
  return longMonthFormat.format(toDate(key))
}

export function formatMonthShort(key: MonthKey): string {
  return shortMonthFormat.format(toDate(key))
}
