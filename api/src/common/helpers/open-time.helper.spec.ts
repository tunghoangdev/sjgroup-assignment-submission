import {
  parseOpenTimeToSchedule,
  checkOpenTimeWithSchedule,
  checkOpenTime,
} from './open-time.helper';

// Use a local inline type to avoid import-type issues with bun bundler
type OpenSchedule = { days: number[]; start: number; end: number };

describe('parseOpenTimeToSchedule', () => {
  it('should return null for null input', () => {
    expect(parseOpenTimeToSchedule(null)).toBeNull();
  });

  it('should parse "Always open" to all 7 days full day', () => {
    const result = parseOpenTimeToSchedule('Always open');
    expect(result).toEqual({
      days: [0, 1, 2, 3, 4, 5, 6],
      start: 0,
      end: 1440,
    });
  });

  it('should parse "Mon to Fri (9AM to 6PM)"', () => {
    const result = parseOpenTimeToSchedule('Mon to Fri (9AM to 6PM)');
    expect(result).not.toBeNull();
    expect(result!.days).toEqual([1, 2, 3, 4, 5]); // Mon=1 to Fri=5
    expect(result!.start).toBe(540); // 9 * 60
    expect(result!.end).toBe(1080); // 18 * 60
  });

  it('should parse "Mon to Sat (8AM to 5PM)"', () => {
    const result = parseOpenTimeToSchedule('Mon to Sat (8AM to 5PM)');
    expect(result).not.toBeNull();
    expect(result!.days).toEqual([1, 2, 3, 4, 5, 6]); // Mon to Sat
    expect(result!.start).toBe(480); // 8 * 60
    expect(result!.end).toBe(1020); // 17 * 60
  });

  it('should parse "Mon to Sun (9AM to 6PM)"', () => {
    const result = parseOpenTimeToSchedule('Mon to Sun (9AM to 6PM)');
    expect(result).not.toBeNull();
    expect(result!.days).toContain(0); // Sun
    expect(result!.days).toContain(6); // Sat
    expect(result!.days).toHaveLength(7);
  });

  it('should throw for invalid format', () => {
    expect(() => parseOpenTimeToSchedule('Invalid format')).toThrow();
  });
});

describe('checkOpenTimeWithSchedule', () => {
  // Mon to Fri, 9AM to 6PM (UTC+7, so test with real UTC timestamps)
  // Wednesday 2026-06-10 in Asia/Ho_Chi_Minh = 2026-06-09T17:00:00Z (UTC)
  const schedule: OpenSchedule = {
    days: [1, 2, 3, 4, 5],
    start: 540, // 9AM
    end: 1080, // 6PM
  };

  // Wednesday 2026-06-10 10:00 → 11:00 Vietnam time (03:00 → 04:00 UTC)
  const wednesdayStart = new Date('2026-06-10T03:00:00.000Z');
  const wednesdayEnd = new Date('2026-06-10T04:00:00.000Z');

  // Saturday 2026-06-13 10:00 Vietnam time (03:00 UTC)
  const saturdayStart = new Date('2026-06-13T03:00:00.000Z');
  const saturdayEnd = new Date('2026-06-13T04:00:00.000Z');

  // Wednesday at 8PM Vietnam = 13:00 UTC (outside operational hours)
  const lateStart = new Date('2026-06-10T13:00:00.000Z');
  const lateEnd = new Date('2026-06-10T14:00:00.000Z');

  it('should return valid for a valid weekday booking within hours', () => {
    const result = checkOpenTimeWithSchedule(
      schedule,
      wednesdayStart,
      wednesdayEnd,
    );
    expect(result.isValid).toBe(true);
  });

  it('should reject booking on Saturday (outside operational days)', () => {
    const result = checkOpenTimeWithSchedule(
      schedule,
      saturdayStart,
      saturdayEnd,
    );
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('operational days');
  });

  it('should reject booking outside operational hours', () => {
    const result = checkOpenTimeWithSchedule(schedule, lateStart, lateEnd);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('operational hours');
  });

  it('should return invalid for null schedule', () => {
    const result = checkOpenTimeWithSchedule(
      null,
      wednesdayStart,
      wednesdayEnd,
    );
    expect(result.isValid).toBe(false);
  });
});

describe('checkOpenTime', () => {
  it('should validate against an openTime string', () => {
    // Wednesday 2026-06-10 10:00 AM Vietnam time
    const start = new Date('2026-06-10T03:00:00.000Z');
    const end = new Date('2026-06-10T04:00:00.000Z');
    const result = checkOpenTime('Mon to Fri (9AM to 6PM)', start, end);
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for null openTimeStr', () => {
    const start = new Date('2026-06-10T03:00:00.000Z');
    const end = new Date('2026-06-10T04:00:00.000Z');
    const result = checkOpenTime(null, start, end);
    expect(result.isValid).toBe(false);
  });

  it('should return invalid for malformed openTime string', () => {
    const start = new Date('2026-06-10T03:00:00.000Z');
    const end = new Date('2026-06-10T04:00:00.000Z');
    const result = checkOpenTime('broken format', start, end);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Error parsing');
  });
});
