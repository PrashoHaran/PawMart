import { env } from '../config/env.js';

export const DEFAULT_TIME_SLOTS = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const SLOT_LABEL_PATTERN = /^(\d{1,2}):(\d{2})\s?(AM|PM)$/i;

// Older services were created before per-service schedules existed.
export function serviceSchedule(service) {
  return {
    timeSlots: service.timeSlots?.length ? service.timeSlots : DEFAULT_TIME_SLOTS,
    availableDays: service.availableDays?.length ? service.availableDays : ALL_DAYS,
  };
}

// "2026-10-20" + "02:30 PM" -> the exact instant, in the app's UTC offset.
export function parseSlotToDate(date, timeSlotLabel) {
  const match = timeSlotLabel.match(SLOT_LABEL_PATTERN);
  if (!match) return null;

  let [, hours, minutes, meridiem] = match;
  hours = parseInt(hours, 10);
  meridiem = meridiem.toUpperCase();
  if (hours < 1 || hours > 12 || Number(minutes) > 59) return null;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const scheduledAt = new Date(`${date}T${String(hours).padStart(2, '0')}:${minutes}:00${env.appUtcOffset}`);
  return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt;
}

// Weekday (0 = Sunday) of a YYYY-MM-DD calendar date.
export function weekdayOf(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// Sorts labels like "01:00 PM" chronologically.
export function sortSlots(labels) {
  const minutes = (label) => {
    const [, h, m, mer] = label.match(SLOT_LABEL_PATTERN);
    return ((Number(h) % 12) + (mer.toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m);
  };
  return [...labels].sort((a, b) => minutes(a) - minutes(b));
}
