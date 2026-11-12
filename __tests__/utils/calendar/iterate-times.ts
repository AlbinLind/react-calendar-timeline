import { createDayjsInTimezone, iterateTimes } from "lib/utility/calendar";
import dayjs from "dayjs";

describe("iterateTimes", () => {
  const defaultTimeSteps = {
    second: 1,
    minute: 1,
    hour: 1,
    day: 1,
    week: 1,
    isoWeek: 1,
    month: 1,
    year: 1,
  };

  it("iterates over each day in the range", () => {
    const start = dayjs("2024-01-01").valueOf();
    const end = dayjs("2024-01-04").valueOf();
    const intervals: Array<{ start: number; end: number }> = [];

    iterateTimes(start, end, "day", defaultTimeSteps, (time, nextTime) => {
      intervals.push({ start: time.valueOf(), end: nextTime.valueOf() });
    });

    expect(intervals).toHaveLength(3);
    expect(dayjs(intervals[0].start).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(intervals[1].start).format("YYYY-MM-DD")).toBe("2024-01-02");
    expect(dayjs(intervals[2].start).format("YYYY-MM-DD")).toBe("2024-01-03");
  });

  it("iterates over each hour in the range", () => {
    const start = dayjs("2024-01-01T00:00").valueOf();
    const end = dayjs("2024-01-01T03:00").valueOf();
    const intervals: number[] = [];

    iterateTimes(start, end, "hour", defaultTimeSteps, (time) => {
      intervals.push(time.hour());
    });

    expect(intervals).toEqual([0, 1, 2]);
  });

  it("respects timeSteps larger than 1", () => {
    const start = dayjs("2024-01-01T00:00").valueOf();
    const end = dayjs("2024-01-01T06:00").valueOf();
    const timeSteps = { ...defaultTimeSteps, hour: 2 };
    const hours: number[] = [];

    iterateTimes(start, end, "hour", timeSteps, (time) => {
      hours.push(time.hour());
    });

    expect(hours).toEqual([0, 2, 4]);
  });

  it("iterates over isoWeeks starting on Mondays", () => {
    const start = dayjs("2024-01-10").valueOf(); // a Wednesday
    const end = dayjs("2024-01-31").valueOf();
    const intervals: Array<{ start: string; end: string }> = [];

    iterateTimes(start, end, "isoWeek", defaultTimeSteps, (time, nextTime) => {
      intervals.push({ start: time.format("YYYY-MM-DD ddd"), end: nextTime.format("YYYY-MM-DD ddd") });
    });

    expect(intervals[0].start).toBe("2024-01-08 Mon");
    expect(intervals[0].end).toBe("2024-01-15 Mon");
    expect(intervals[1].start).toBe("2024-01-15 Mon");
    expect(intervals[2].start).toBe("2024-01-22 Mon");
    expect(intervals[3].start).toBe("2024-01-29 Mon");
  });

  it("iterates over months", () => {
    const start = dayjs("2024-01-01").valueOf();
    const end = dayjs("2024-04-01").valueOf();
    const months: number[] = [];

    iterateTimes(start, end, "month", defaultTimeSteps, (time) => {
      months.push(time.month()); // 0-indexed
    });

    expect(months).toEqual([0, 1, 2]);
  });

  it("handles empty range (start === end)", () => {
    const time = dayjs("2024-01-01").valueOf();
    const callback = vi.fn();

    iterateTimes(time, time, "day", defaultTimeSteps, callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("provides nextTime as start of next interval", () => {
    const start = dayjs("2024-01-15").valueOf();
    const end = dayjs("2024-01-17").valueOf();
    const intervals: Array<{ start: string; end: string }> = [];

    iterateTimes(start, end, "day", defaultTimeSteps, (time, nextTime) => {
      intervals.push({
        start: time.format("YYYY-MM-DD HH:mm"),
        end: nextTime.format("YYYY-MM-DD HH:mm"),
      });
    });

    expect(intervals[0].start).toBe("2024-01-15 00:00");
    expect(intervals[0].end).toBe("2024-01-16 00:00");
    expect(intervals[1].start).toBe("2024-01-16 00:00");
    expect(intervals[1].end).toBe("2024-01-17 00:00");
  });

  it.each(["hour", "day", "month"] as const)("labels %s intervals in UTC across DST changes", (unit) => {
    // Spans both 2024 EU DST changes, which a local timezone may observe.
    const start = Date.UTC(2024, 2, 28, 17, 30);
    const end = Date.UTC(2024, 10, 2);
    const intervals: Array<{ end: number; label: string; start: number }> = [];

    iterateTimes(
      start,
      end,
      unit,
      defaultTimeSteps,
      (time, nextTime) => {
        intervals.push({ end: nextTime.valueOf(), label: time.format("YYYY-MM-DDTHH:mm"), start: time.valueOf() });
      },
      "UTC"
    );

    expect(intervals.length).toBeGreaterThan(0);
    for (const [index, interval] of intervals.entries()) {
      expect(interval.label).toBe(new Date(interval.start).toISOString().slice(0, 16));
      if (unit === "hour") expect(interval.end - interval.start).toBe(3_600_000);
      if (unit === "day") expect(interval.end - interval.start).toBe(86_400_000);
      if (index > 0) expect(interval.start).toBe(intervals[index - 1].end);
    }
  });

  it("gives the same intervals for UTC and Etc/UTC", () => {
    const start = Date.UTC(2024, 0, 1);
    const end = Date.UTC(2024, 1, 1);
    const collect = (timezone: string) => {
      const starts: number[] = [];
      iterateTimes(start, end, "day", defaultTimeSteps, (time) => starts.push(time.valueOf()), timezone);
      return starts;
    };

    expect(collect("UTC")).toEqual(collect("Etc/UTC"));
  });
});

describe("createDayjsInTimezone", () => {
  it("keeps the instant and reads UTC wall time for UTC", () => {
    // During the 2024 EU DST change back.
    const time = Date.UTC(2024, 9, 27, 1, 30);
    const utc = createDayjsInTimezone(time, "UTC");

    expect(utc.valueOf()).toBe(time);
    expect(utc.utcOffset()).toBe(0);
    expect(utc.format("YYYY-MM-DD HH:mm Z")).toBe("2024-10-27 01:30 +00:00");
    expect(utc.startOf("day").valueOf()).toBe(Date.UTC(2024, 9, 27));
  });

  it("keeps the locale of a dayjs input", () => {
    const time = dayjs(Date.UTC(2024, 0, 1)).locale("en");
    expect(createDayjsInTimezone(time, "UTC").locale()).toBe("en");
  });

  it("still converts other timezones", () => {
    const time = Date.UTC(2024, 6, 1, 12);
    expect(createDayjsInTimezone(time, "Europe/Amsterdam").format("HH:mm")).toBe("14:00");
  });
});
