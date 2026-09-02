import { CURRENCY, LOCALE } from '../config'

export const formatCurrency = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
}).format

/** Currency without decimals — used where cents would be noise (budget inputs, axes). */
export const formatCurrencyRounded = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
}).format

export const formatShortDate = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
}).format

export const formatPercent = (value: number): string => `${Math.round(value)}%`
