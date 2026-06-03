import { defaultSchedule } from "@/lib/constants";
import type { ScheduleRule, TimeEntry } from "@/types";

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const readPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = readPart("weekday");
  const year = Number(readPart("year") || "0");
  const month = Number(readPart("month") || "0");
  const day = Number(readPart("day") || "0");
  const hour = Number(readPart("hour") || "0");
  const minute = Number(readPart("minute") || "0");

  return { day, hour, minute, month, weekday, year };
}

function dateMinutes(date: Date, timeZone: string) {
  const { hour, minute } = getLocalTimeParts(date, timeZone);
  return hour * 60 + minute;
}

function getDayIndex(date: Date, timeZone: string) {
  const weekday = getLocalTimeParts(date, timeZone).weekday;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return weekdays.indexOf(weekday);
}

function getDayRule(date: Date, timeZone: string): ScheduleRule {
  const dayIndex = getDayIndex(date, timeZone);
  return defaultSchedule.weekdays[dayIndex] ?? defaultSchedule.weekdays[1];
}

function isSameCalendarDay(start: Date, end: Date, timeZone: string) {
  const startParts = getLocalTimeParts(start, timeZone);
  const endParts = getLocalTimeParts(end, timeZone);

  return (
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.day === endParts.day
  );
}

export function isOvertime(date: Date, timeZone = defaultSchedule.timezone) {
  const rule = getDayRule(date, timeZone);
  if (!rule.enabled) {
    return true;
  }

  return dateMinutes(date, timeZone) > timeToMinutes(rule.end);
}

export function classifyEntryTimestamp(timestamp: string, timeZone = defaultSchedule.timezone) {
  return isOvertime(new Date(timestamp), timeZone);
}

export function calculateWorkedMinutes(
  entries: TimeEntry[],
  options?: { timeZone?: string },
) {
  const timeZone = options?.timeZone ?? defaultSchedule.timezone;
  const ordered = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  let openSegment: Date | null = null;
  let normalMinutes = 0;
  let overtimeMinutes = 0;

  for (const entry of ordered) {
    const entryDate = new Date(entry.timestamp);
    const openTypes = entry.type === "entry" || entry.type === "return" || entry.type === "overtime";
    const closeTypes = entry.type === "pause" || entry.type === "exit";

    if (openTypes && !openSegment) {
      openSegment = entryDate;
      continue;
    }

    if (closeTypes && openSegment) {
      const rule = getDayRule(openSegment, timeZone);
      const start = dateMinutes(openSegment, timeZone);
      const end = dateMinutes(entryDate, timeZone);
      const shiftEnd = timeToMinutes(rule.end);
      const durationMinutes = Math.max(Math.round((entryDate.getTime() - openSegment.getTime()) / 60000), 0);
      const sameCalendarDay = isSameCalendarDay(openSegment, entryDate, timeZone);

      if (!rule.enabled || start >= shiftEnd) {
        overtimeMinutes += durationMinutes;
      } else if (sameCalendarDay && end <= shiftEnd) {
        normalMinutes += durationMinutes;
      } else {
        const normalPart = Math.max(shiftEnd - start, 0);
        normalMinutes += Math.min(normalPart, durationMinutes);
        overtimeMinutes += Math.max(durationMinutes - Math.min(normalPart, durationMinutes), 0);
      }

      openSegment = null;
    }
  }

  return {
    normalMinutes,
    overtimeMinutes,
    totalMinutes: normalMinutes + overtimeMinutes,
  };
}
