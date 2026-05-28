import { defaultSchedule } from "@/lib/constants";
import type { ScheduleRule, TimeEntry } from "@/types";

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getDayRule(date: Date): ScheduleRule {
  return defaultSchedule.weekdays[date.getDay()] ?? defaultSchedule.weekdays[1];
}

export function isOvertime(date: Date) {
  const rule = getDayRule(date);
  if (!rule.enabled) {
    return true;
  }

  return dateMinutes(date) > timeToMinutes(rule.end);
}

export function classifyEntryTimestamp(timestamp: string) {
  return isOvertime(new Date(timestamp));
}

export function calculateWorkedMinutes(entries: TimeEntry[]) {
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
      const rule = getDayRule(openSegment);
      const start = dateMinutes(openSegment);
      const end = dateMinutes(entryDate);
      const shiftEnd = timeToMinutes(rule.end);

      if (!rule.enabled || start >= shiftEnd) {
        overtimeMinutes += Math.max(end - start, 0);
      } else if (end <= shiftEnd) {
        normalMinutes += Math.max(end - start, 0);
      } else {
        normalMinutes += Math.max(shiftEnd - start, 0);
        overtimeMinutes += Math.max(end - shiftEnd, 0);
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
