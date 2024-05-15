import { CalendarDate } from "@internationalized/date";

export function toCalendarDate(d: Date) {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
