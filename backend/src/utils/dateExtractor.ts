const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Extracts a date mentioned in a text string (e.g. task title or description).
 * Returns Date set to noon (12:00:00) to prevent cross-timezone drift.
 */
export function extractDateFromText(text: string): Date | null {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  const currentYear = new Date().getFullYear();

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = clean.match(/\b(20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d, 12, 0, 0);
  }

  // 2. Format: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d\d)\b/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    return new Date(y, m, d, 12, 0, 0);
  }

  // 3. Format: Month Name DD (e.g. Oct 15, October 15th, Oct 15 2026, Oct 15, 2026)
  const monthDayMatch = clean.match(
    /\b(?:on|by|at|due)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?(?:,?\s*(20\d\d))?\b/i
  );
  if (monthDayMatch) {
    const mName = monthDayMatch[1].toLowerCase();
    const m = MONTHS[mName] !== undefined ? MONTHS[mName] : -1;
    const d = parseInt(monthDayMatch[2], 10);
    const y = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : currentYear;
    if (m !== -1) {
      return new Date(y, m, d, 12, 0, 0);
    }
  }

  // 4. Format: DD Month Name (e.g. 15 Oct, 15th October, 15th of October 2026)
  const dayMonthMatch = clean.match(
    /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(20\d\d))?\b/i
  );
  if (dayMonthMatch) {
    const d = parseInt(dayMonthMatch[1], 10);
    const mName = dayMonthMatch[2].toLowerCase();
    const m = MONTHS[mName] !== undefined ? MONTHS[mName] : -1;
    const y = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : currentYear;
    if (m !== -1) {
      return new Date(y, m, d, 12, 0, 0);
    }
  }

  // 5. Relative words: today, tomorrow
  if (/\b(?:due|on|by)?\s*today\b/i.test(clean)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  if (/\b(?:due|on|by)?\s*tomorrow\b/i.test(clean)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
  }

  // 6. Relative weekdays: next monday, next friday, etc.
  const nextDayMatch = clean.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (nextDayMatch) {
    const daysMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    const targetDay = daysMap[nextDayMatch[1].toLowerCase()];
    if (targetDay !== undefined) {
      const now = new Date();
      let diff = targetDay - now.getDay();
      if (diff <= 0) diff += 7;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 12, 0, 0);
    }
  }

  return null;
}
