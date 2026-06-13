const DAYS_MAP: { [key: string]: number } = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};

function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const cleaned = timeStr.trim().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+)(?::(\d+))?(AM|PM)$/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function getDayNum(dayStr: string): number {
  const key = dayStr.trim().toLowerCase();
  if (key in DAYS_MAP) {
    return DAYS_MAP[key];
  }
  throw new Error(`Invalid day name: ${dayStr}`);
}

export interface OpenSchedule {
  days: number[]; // 0 (Sun) to 6 (Sat)
  start: number; // minutes from midnight
  end: number; // minutes from midnight
}

export function parseOpenTimeToSchedule(
  openTimeStr: string | null,
): OpenSchedule | null {
  if (!openTimeStr) return null;
  const normalized = openTimeStr.trim().replace(/\s+/g, ' ');
  if (normalized.toLowerCase() === 'always open') {
    return {
      days: [0, 1, 2, 3, 4, 5, 6],
      start: 0,
      end: 1440,
    };
  }

  const regex = /^([a-zA-Z]+)\s+to\s+([a-zA-Z]+)\s*\((.+)\s+to\s+(.+)\)$/i;
  const match = normalized.match(regex);
  if (!match) {
    throw new Error(`Invalid open time format: "${openTimeStr}"`);
  }

  const startDayStr = match[1];
  const endDayStr = match[2];
  const startTimeStr = match[3];
  const endTimeStr = match[4];

  const startDay = getDayNum(startDayStr);
  const endDay = getDayNum(endDayStr);
  const allowedStart = parseTimeString(startTimeStr);
  const allowedEnd = parseTimeString(endTimeStr);

  const startMin = allowedStart.hours * 60 + allowedStart.minutes;
  const endMin = allowedEnd.hours * 60 + allowedEnd.minutes;

  const days: number[] = [];
  let current = startDay;
  while (true) {
    days.push(current);
    if (current === endDay) break;
    current = (current + 1) % 7;
  }

  return {
    days,
    start: startMin,
    end: endMin,
  };
}

export function checkOpenTimeWithSchedule(
  schedule: OpenSchedule | null,
  start: Date,
  end: Date,
): { isValid: boolean; reason?: string } {
  if (!schedule) {
    return { isValid: false, reason: 'Location open time is not configured' };
  }

  // We need to check both the start and end of the booking
  const daysToCheck = [start, end];

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
  });

  const dateOnlyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  for (const date of daysToCheck) {
    const dayStr = dayFormatter.format(date).toLowerCase();
    const dayNum = DAYS_MAP[dayStr];

    if (!schedule.days.includes(dayNum)) {
      return {
        isValid: false,
        reason: 'Booking is outside the operational days of the room',
      };
    }

    // Check time of day
    const timeParts = timeFormatter.formatToParts(date);
    let hours = parseInt(
      timeParts.find((p) => p.type === 'hour')?.value || '0',
      10,
    );
    const minutes = parseInt(
      timeParts.find((p) => p.type === 'minute')?.value || '0',
      10,
    );
    if (hours === 24) hours = 0; // Intl sometimes returns 24 for midnight
    const minutesOfDay = hours * 60 + minutes;

    if (minutesOfDay < schedule.start || minutesOfDay > schedule.end) {
      const formatTime = (min: number) => {
        const hrs = Math.floor(min / 60);
        const mins = min % 60;
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
        const displayMins =
          mins > 0 ? `:${mins.toString().padStart(2, '0')}` : '';
        return `${displayHrs}${displayMins}${ampm}`;
      };
      return {
        isValid: false,
        reason: `Booking time is outside the operational hours of the room (${formatTime(schedule.start)} to ${formatTime(schedule.end)})`,
      };
    }
  }

  // Check if booking spans across days
  const startDayStr = dateOnlyFormatter.format(start);
  const endDayStr = dateOnlyFormatter.format(end);
  if (startDayStr !== endDayStr) {
    if (start.getTime() > end.getTime()) {
      return {
        isValid: false,
        reason: 'Booking start time must be before end time',
      };
    }
    const currentDate = new Date(start.getTime());
    while (currentDate.getTime() < end.getTime()) {
      const dayStr = dayFormatter.format(currentDate).toLowerCase();
      const dayNum = DAYS_MAP[dayStr];
      if (!schedule.days.includes(dayNum)) {
        return {
          isValid: false,
          reason: 'Booking spans across non-operational days',
        };
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  return { isValid: true };
}

export function checkOpenTime(
  openTimeStr: string | null,
  start: Date,
  end: Date,
): { isValid: boolean; reason?: string } {
  try {
    const schedule = parseOpenTimeToSchedule(openTimeStr);
    return checkOpenTimeWithSchedule(schedule, start, end);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      reason: `Error parsing open time configuration: ${msg}`,
    };
  }
}
