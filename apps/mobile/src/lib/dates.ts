/**
 * @camino/mobile - Prayer Season Utilities
 * Determines liturgical seasons for dynamic UI coloring
 */

export const getPrayerSeason = (
  date: Date | string
): 'ordinary' | 'advent' | 'christmas' | 'lent' | 'holy-week' | 'easter' | 'martyrs' => {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const month = date.getMonth()
  const day = date.getDate()

  // Advent: 4 Sundays before Christmas (Nov 26 - Dec 24, 2024)
  if ((month === 10 && day >= 26) || (month === 11 && day <= 24)) {
    return 'advent'
  }

  // Christmas: Dec 25 - Jan 5
  if ((month === 11 && day >= 25) || (month === 0 && day <= 5)) {
    return 'christmas'
  }

  // Lent: Ash Wednesday (Feb 14) - Easter Eve (Mar 30)
  if ((month === 1 && day >= 14) || (month === 2 && day <= 30)) {
    return 'lent'
  }

  // Holy Week: Palm Sunday (Mar 24) - Easter Eve (Mar 30)
  if (month === 2 && day >= 24 && day <= 30) {
    return 'holy-week'
  }

  // Easter: Easter Sunday (Mar 31) - Pentecost (May 19)
  if ((month === 2 && day === 31) || (month === 3 && day <= 20) || (month === 4 && day <= 19)) {
    return 'easter'
  }

  // Martyrs (approximation): Period aligned with saints commemorations
  if ((month === 4 && day >= 25) || (month === 5 && day <= 10)) {
    return 'martyrs'
  }

  // Default: Ordinary Time
  return 'ordinary'
}
