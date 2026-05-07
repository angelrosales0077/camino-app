declare module 'romcal' {
  interface CalendarOptions {
    year: number
    locale?: string
    country?: string
    type?: string
  }

  const romcal: {
    calendarFor(options: CalendarOptions): unknown[]
  }

  export default romcal
}
