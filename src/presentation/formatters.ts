export const formatCurrency = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
}).format

export const formatShortDate = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
}).format

export const currentMonthLabel = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
}).format(new Date()).toUpperCase()
