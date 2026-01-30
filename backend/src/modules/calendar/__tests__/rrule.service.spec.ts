import { Test, TestingModule } from '@nestjs/testing';
import { RRuleService } from '../rrule.service';

describe('RRuleService', () => {
  let service: RRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RRuleService],
    }).compile();

    service = module.get<RRuleService>(RRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRRule', () => {
    it('should generate daily RRULE with interval', () => {
      const result = service.generateRRule({
        frequency: 'daily',
        interval: 2,
      });
      expect(result).toContain('FREQ=DAILY');
      expect(result).toContain('INTERVAL=2');
    });

    it('should generate weekly RRULE with specific weekdays', () => {
      const result = service.generateRRule({
        frequency: 'weekly',
        interval: 1,
        byweekday: [0, 2, 4], // Mon, Wed, Fri
      });
      expect(result).toContain('FREQ=WEEKLY');
      expect(result).toContain('BYDAY=MO,WE,FR');
    });

    it('should generate monthly RRULE with count', () => {
      const result = service.generateRRule({
        frequency: 'monthly',
        interval: 1,
        count: 12,
      });
      expect(result).toContain('FREQ=MONTHLY');
      expect(result).toContain('COUNT=12');
    });

    it('should generate yearly RRULE with until date', () => {
      const untilDate = new Date('2026-12-31');
      const result = service.generateRRule({
        frequency: 'yearly',
        interval: 1,
        until: untilDate,
      });
      expect(result).toContain('FREQ=YEARLY');
      expect(result).toContain('UNTIL=');
    });

    it('should handle default interval of 1', () => {
      const result = service.generateRRule({
        frequency: 'daily',
      });
      expect(result).toContain('INTERVAL=1');
    });
  });

  describe('expandRecurrence', () => {
    it('should expand daily recurrence within range', () => {
      const rrule = 'FREQ=DAILY;INTERVAL=1;COUNT=5';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const rangeStart = new Date('2026-02-01');
      const rangeEnd = new Date('2026-02-10');

      const result = service.expandRecurrence(
        rrule,
        startTime,
        rangeStart,
        rangeEnd,
      );
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should expand weekly recurrence with specific days', () => {
      const rrule = 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;COUNT=6';
      const startTime = new Date('2026-02-02T09:00:00Z'); // Monday
      const rangeStart = new Date('2026-02-01');
      const rangeEnd = new Date('2026-02-28');

      const result = service.expandRecurrence(
        rrule,
        startTime,
        rangeStart,
        rangeEnd,
      );
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should return only dates within specified range', () => {
      const rrule = 'FREQ=DAILY;INTERVAL=1;COUNT=30';
      const startTime = new Date('2026-01-15T10:00:00Z');
      const rangeStart = new Date('2026-01-20');
      const rangeEnd = new Date('2026-01-25');

      const result = service.expandRecurrence(
        rrule,
        startTime,
        rangeStart,
        rangeEnd,
      );
      result.forEach((date) => {
        expect(date.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(rangeEnd.getTime());
      });
    });

    it('should return startTime in array on invalid RRULE', () => {
      const invalidRRule = 'INVALID_RRULE_STRING';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const rangeStart = new Date('2026-02-01');
      const rangeEnd = new Date('2026-02-10');

      const result = service.expandRecurrence(
        invalidRRule,
        startTime,
        rangeStart,
        rangeEnd,
      );
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(startTime);
    });

    it('should handle empty range gracefully', () => {
      const rrule = 'FREQ=DAILY;INTERVAL=1;COUNT=5';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const rangeStart = new Date('2026-03-01');
      const rangeEnd = new Date('2026-03-10');

      const result = service.expandRecurrence(
        rrule,
        startTime,
        rangeStart,
        rangeEnd,
      );
      expect(result.length).toBe(0);
    });
  });

  describe('isValidRRule', () => {
    it('should return true for valid daily RRULE', () => {
      expect(service.isValidRRule('FREQ=DAILY;INTERVAL=1')).toBe(true);
    });

    it('should return true for valid weekly RRULE', () => {
      expect(
        service.isValidRRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR'),
      ).toBe(true);
    });

    it('should return true for valid monthly RRULE with count', () => {
      expect(service.isValidRRule('FREQ=MONTHLY;INTERVAL=1;COUNT=12')).toBe(
        true,
      );
    });

    it('should return false for invalid RRULE string', () => {
      expect(service.isValidRRule('NOT_A_VALID_RRULE')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isValidRRule('')).toBe(false);
    });

    it('should return false for malformed RRULE', () => {
      expect(service.isValidRRule('FREQ=INVALID_FREQ')).toBe(false);
    });
  });

  describe('getNextOccurrence', () => {
    it('should return next occurrence after given date', () => {
      const rrule = 'FREQ=DAILY;INTERVAL=1;COUNT=10';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const afterDate = new Date('2026-02-03');

      const result = service.getNextOccurrence(rrule, startTime, afterDate);
      expect(result).not.toBeNull();
      expect(result!.getTime()).toBeGreaterThan(afterDate.getTime());
    });

    it('should return null when no more occurrences', () => {
      const rrule = 'FREQ=DAILY;INTERVAL=1;COUNT=3';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const afterDate = new Date('2026-02-10');

      const result = service.getNextOccurrence(rrule, startTime, afterDate);
      expect(result).toBeNull();
    });

    it('should handle weekly recurrence correctly', () => {
      const rrule = 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;COUNT=5';
      const startTime = new Date('2026-02-02T10:00:00Z'); // Monday
      const afterDate = new Date('2026-02-03');

      const result = service.getNextOccurrence(rrule, startTime, afterDate);
      expect(result).not.toBeNull();
      expect(result!.getDay()).toBe(1); // Should be Monday
    });

    it('should return null for invalid RRULE', () => {
      const invalidRRule = 'INVALID';
      const startTime = new Date('2026-02-01T10:00:00Z');
      const afterDate = new Date('2026-02-03');

      const result = service.getNextOccurrence(
        invalidRRule,
        startTime,
        afterDate,
      );
      expect(result).toBeNull();
    });
  });

  describe('describeRecurrence', () => {
    it('should describe daily recurrence', () => {
      const result = service.describeRecurrence('FREQ=DAILY;INTERVAL=1');
      expect(result.toLowerCase()).toContain('day');
    });

    it('should describe weekly recurrence', () => {
      const result = service.describeRecurrence(
        'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR',
      );
      expect(result.toLowerCase()).toContain('week');
    });

    it('should describe monthly recurrence', () => {
      const result = service.describeRecurrence('FREQ=MONTHLY;INTERVAL=1');
      expect(result.toLowerCase()).toContain('month');
    });

    it('should describe yearly recurrence', () => {
      const result = service.describeRecurrence('FREQ=YEARLY;INTERVAL=1');
      expect(result.toLowerCase()).toContain('year');
    });

    it('should return custom message for invalid RRULE', () => {
      const result = service.describeRecurrence('INVALID_RRULE');
      expect(result).toBe('Lặp lại tùy chỉnh');
    });

    it('should handle RRULE with interval greater than 1', () => {
      const result = service.describeRecurrence('FREQ=DAILY;INTERVAL=3');
      expect(result).toContain('3');
    });
  });

  describe('getCommonPatterns', () => {
    it('should return exactly 5 common patterns', () => {
      const patterns = service.getCommonPatterns();
      expect(patterns).toHaveLength(5);
    });

    it('should return patterns with label and value properties', () => {
      const patterns = service.getCommonPatterns();
      patterns.forEach((pattern) => {
        expect(pattern).toHaveProperty('label');
        expect(pattern).toHaveProperty('value');
        expect(typeof pattern.label).toBe('string');
        expect(typeof pattern.value).toBe('string');
      });
    });

    it('should include daily pattern', () => {
      const patterns = service.getCommonPatterns();
      const dailyPattern = patterns.find((p) => p.value.includes('FREQ=DAILY'));
      expect(dailyPattern).toBeDefined();
    });

    it('should include weekly pattern', () => {
      const patterns = service.getCommonPatterns();
      const weeklyPattern = patterns.find((p) =>
        p.value.includes('FREQ=WEEKLY'),
      );
      expect(weeklyPattern).toBeDefined();
    });

    it('should include monthly pattern', () => {
      const patterns = service.getCommonPatterns();
      const monthlyPattern = patterns.find((p) =>
        p.value.includes('FREQ=MONTHLY'),
      );
      expect(monthlyPattern).toBeDefined();
    });

    it('should return valid RRULE strings for all patterns', () => {
      const patterns = service.getCommonPatterns();
      patterns.forEach((pattern) => {
        expect(service.isValidRRule(pattern.value)).toBe(true);
      });
    });
  });
});
