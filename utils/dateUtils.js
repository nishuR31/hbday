/**
 * Date utilities for Birthday automation and calculation.
 * Safe from UTC vs Local timezone shifts.
 */

/**
 * Safely parse a YYYY-MM-DD string into year, month (1-12), and day (1-31).
 */
export const parseDOB = (dob) => {
  if (!dob) return null;
  const parts = String(dob).trim().split("-");
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
};

/**
 * Checks if a given year is a leap year.
 */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Format a Date object into local YYYY-MM-DD string (safe from UTC offset).
 */
export const formatDateYYYYMMDD = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Checks whether the DOB matches today's month and day.
 * Accounts for Feb 29 leap day birthdays on non-leap years (celebrated Feb 28).
 */
export const isBirthdayToday = (dob, now = new Date()) => {
  const parsed = parseDOB(dob);
  if (!parsed) return false;

  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate(); // 1-31
  const currentYear = now.getFullYear();

  // Exact match
  if (parsed.month === currentMonth && parsed.day === currentDay) {
    return true;
  }

  // Handle Feb 29 leap day on non-leap years
  if (parsed.month === 2 && parsed.day === 29 && !isLeapYear(currentYear)) {
    if (currentMonth === 2 && currentDay === 28) {
      return true;
    }
  }

  return false;
};

/**
 * Returns a normalized Date object (midnight local time) for the upcoming birthday.
 * If today is their birthday, returns today at 00:00:00.
 */
export const getNextBirthday = (dob, now = new Date()) => {
  const parsed = parseDOB(dob);
  if (!parsed) return null;

  const currentYear = now.getFullYear();
  const todayMidnight = new Date(currentYear, now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Month is 0-indexed for Date constructor
  let targetMonth = parsed.month - 1;
  let targetDay = parsed.day;

  // Leap year adjustment if born Feb 29
  if (parsed.month === 2 && parsed.day === 29 && !isLeapYear(currentYear)) {
    targetDay = 28;
  }

  let next = new Date(currentYear, targetMonth, targetDay, 0, 0, 0, 0);

  if (next < todayMidnight) {
    const nextYear = currentYear + 1;
    let nextYearDay = parsed.day;
    if (parsed.month === 2 && parsed.day === 29 && !isLeapYear(nextYear)) {
      nextYearDay = 28;
    }
    next = new Date(nextYear, targetMonth, nextYearDay, 0, 0, 0, 0);
  }

  return next;
};

/**
 * Calculates remaining days until the next birthday.
 * Returns 0 if today is their birthday.
 */
export const daysUntil = (dob, now = new Date()) => {
  const nextDate = getNextBirthday(dob, now);
  if (!nextDate) return null;

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const diffMs = nextDate.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculates current age and the age they will turn on their upcoming birthday.
 */
export const calculateAge = (dob, now = new Date()) => {
  const parsed = parseDOB(dob);
  if (!parsed) return { currentAge: null, turningAge: null };

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let currentAge = currentYear - parsed.year;
  const hasHadBirthdayThisYear =
    currentMonth > parsed.month ||
    (currentMonth === parsed.month && currentDay >= parsed.day);

  if (!hasHadBirthdayThisYear) {
    currentAge -= 1;
  }

  const nextBirthday = getNextBirthday(dob, now);
  const turningAge = nextBirthday ? nextBirthday.getFullYear() - parsed.year : currentAge + 1;

  return { currentAge, turningAge };
};

/**
 * Returns zodiac sign object with name, symbol, and element.
 */
export const getZodiacSign = (dob) => {
  const parsed = parseDOB(dob);
  if (!parsed) return null;

  const { month, day } = parsed;

  const signs = [
    { name: "Capricorn", code: "CAP", element: "Earth", start: [12, 22], end: [1, 19] },
    { name: "Aquarius", code: "AQU", element: "Air", start: [1, 20], end: [2, 18] },
    { name: "Pisces", code: "PIS", element: "Water", start: [2, 19], end: [3, 20] },
    { name: "Aries", code: "ARI", element: "Fire", start: [3, 21], end: [4, 19] },
    { name: "Taurus", code: "TAU", element: "Earth", start: [4, 20], end: [5, 20] },
    { name: "Gemini", code: "GEM", element: "Air", start: [5, 21], end: [6, 20] },
    { name: "Cancer", code: "CAN", element: "Water", start: [6, 21], end: [7, 22] },
    { name: "Leo", code: "LEO", element: "Fire", start: [7, 23], end: [8, 22] },
    { name: "Virgo", code: "VIR", element: "Earth", start: [8, 23], end: [9, 22] },
    { name: "Libra", code: "LIB", element: "Air", start: [9, 23], end: [10, 22] },
    { name: "Scorpio", code: "SCO", element: "Water", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius", code: "SAG", element: "Fire", start: [11, 22], end: [12, 21] },
  ];

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (startMonth > endMonth) {
      // Wraps around new year (Capricorn)
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return sign;
      }
    } else {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (month > startMonth && month < endMonth)
      ) {
        return sign;
      }
    }
  }

  return { name: "Capricorn", code: "CAP", element: "Earth" };
};

/**
 * Formats date into readable string, e.g. "Feb 1, 2002"
 */
export const formatDOBReadable = (dob) => {
  const parsed = parseDOB(dob);
  if (!parsed) return dob;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
};

/**
 * Calculates the exact dispatch Date and delay in ms for a contact's upcoming birthday.
 * Incorporates a 5-second eve threshold (23:59:55 on the previous day) so the email
 * finishes delivery right as the clock strikes 12:00:00 midnight on their birthday.
 *
 * @param {string} dob - "YYYY-MM-DD"
 * @param {Date} [now] - Current reference date (defaults to new Date())
 * @param {number} [thresholdMs] - Milliseconds before midnight (default 5000ms = 5s)
 */
export const calculateBirthdayDispatch = (dob, now = new Date(), thresholdMs = 5000) => {
  const parsed = parseDOB(dob);
  if (!parsed) return null;

  const currentYear = now.getFullYear();
  let targetYear = currentYear;
  let targetMonth = parsed.month - 1;
  let targetDay = parsed.day;

  // Leap day handling for Feb 29 on non-leap years
  if (parsed.month === 2 && parsed.day === 29 && !isLeapYear(targetYear)) {
    targetDay = 28;
  }

  // Midnight (00:00:00.000) on the contact's birthday this year
  let birthdayMidnight = new Date(targetYear, targetMonth, targetDay, 0, 0, 0, 0);

  // 5 seconds before midnight on the eve of the birthday (23:59:55 of the previous day)
  let dispatchDate = new Date(birthdayMidnight.getTime() - thresholdMs);

  let isTodayCatchup = false;

  // If the eve trigger has already passed relative to current time:
  if (dispatchDate.getTime() <= now.getTime()) {
    // Check if today IS their birthday
    if (isBirthdayToday(dob, now)) {
      // It's their birthday today, and 23:59:55 yesterday already passed.
      // Immediate catch-up dispatch for today!
      isTodayCatchup = true;
    } else {
      // Birthday this year has already completely passed; target next year's eve!
      targetYear = currentYear + 1;
      let nextDay = parsed.day;
      if (parsed.month === 2 && parsed.day === 29 && !isLeapYear(targetYear)) {
        nextDay = 28;
      }
      birthdayMidnight = new Date(targetYear, targetMonth, nextDay, 0, 0, 0, 0);
      dispatchDate = new Date(birthdayMidnight.getTime() - thresholdMs);
    }
  }

  const delayMs = isTodayCatchup
    ? 1000
    : Math.max(0, dispatchDate.getTime() - now.getTime());

  const turningAge = targetYear - parsed.year;

  return {
    targetYear,
    birthdayDate: birthdayMidnight,
    dispatchDate,
    delayMs,
    turningAge,
    isTodayCatchup
  };
};
