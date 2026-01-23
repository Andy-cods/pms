import { Injectable } from '@nestjs/common';
import { RRule, RRuleSet, rrulestr, Weekday } from 'rrule';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency;
  interval?: number;
  until?: Date;
  count?: number;
  byweekday?: number[]; // 0 = Monday, 6 = Sunday
}

@Injectable()
export class RRuleService {
  private frequencyMap: Record<RecurrenceFrequency, number> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  };

  /**
   * Generate an RRULE string from simple options
   */
  generateRRule(options: RecurrenceOptions): string {
    const rruleOptions: Partial<RRule['options']> = {
      freq: this.frequencyMap[options.frequency],
      interval: options.interval || 1,
    };

    if (options.until) {
      rruleOptions.until = options.until;
    }

    if (options.count) {
      rruleOptions.count = options.count;
    }

    if (options.byweekday && options.byweekday.length > 0) {
      const weekdayMap: Weekday[] = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
      const weekdays = options.byweekday
        .map((day) => weekdayMap[day])
        .filter((wd): wd is Weekday => wd !== undefined);
      (rruleOptions as { byweekday?: Weekday[] }).byweekday = weekdays;
    }

    const rule = new RRule(rruleOptions);
    return rule.toString();
  }

  /**
   * Parse an RRULE string and expand occurrences within a date range
   */
  expandRecurrence(
    rruleString: string,
    startTime: Date,
    rangeStart: Date,
    rangeEnd: Date,
  ): Date[] {
    try {
      // Create RRuleSet to handle the recurrence
      const rruleSet = new RRuleSet();

      // Parse the RRULE string
      const rule = rrulestr(rruleString);

      // Update the dtstart to the event's start time
      const ruleWithStart = new RRule({
        ...rule.options,
        dtstart: startTime,
      });

      rruleSet.rrule(ruleWithStart);

      // Get occurrences within the range
      const occurrences = rruleSet.between(rangeStart, rangeEnd, true);

      return occurrences;
    } catch {
      // If parsing fails, return just the start time if it's in range
      if (startTime >= rangeStart && startTime <= rangeEnd) {
        return [startTime];
      }
      return [];
    }
  }

  /**
   * Check if an RRULE string is valid
   */
  isValidRRule(rruleString: string): boolean {
    try {
      rrulestr(rruleString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get next occurrence after a given date
   */
  getNextOccurrence(rruleString: string, startTime: Date, afterDate: Date): Date | null {
    try {
      const rule = rrulestr(rruleString);
      const ruleWithStart = new RRule({
        ...rule.options,
        dtstart: startTime,
      });

      const next = ruleWithStart.after(afterDate, true);
      return next;
    } catch {
      return null;
    }
  }

  /**
   * Parse RRULE and get human-readable description
   */
  describeRecurrence(rruleString: string): string {
    try {
      const rule = rrulestr(rruleString);
      return rule.toText();
    } catch {
      return 'Lặp lại tùy chỉnh';
    }
  }

  /**
   * Generate common recurrence patterns
   */
  getCommonPatterns(): Array<{ label: string; value: string }> {
    return [
      { label: 'Hàng ngày', value: this.generateRRule({ frequency: 'daily' }) },
      { label: 'Hàng tuần', value: this.generateRRule({ frequency: 'weekly' }) },
      {
        label: 'Các ngày trong tuần',
        value: this.generateRRule({
          frequency: 'weekly',
          byweekday: [0, 1, 2, 3, 4], // Mon-Fri
        }),
      },
      { label: 'Hàng tháng', value: this.generateRRule({ frequency: 'monthly' }) },
      { label: 'Hàng năm', value: this.generateRRule({ frequency: 'yearly' }) },
    ];
  }
}
