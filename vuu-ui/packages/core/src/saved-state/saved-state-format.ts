const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const plural = (count: number, singular: string, pluralForm?: string) =>
  `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;

const parseTime = (timestamp: string | undefined) => {
  if (!timestamp) return undefined;
  const time = Date.parse(timestamp);
  return Number.isNaN(time) ? undefined : time;
};

/** "Just now", "5 hours ago", "Yesterday" … or "Unknown". */
export const formatRelativeTime = (
  timestamp: string | undefined,
  now: Date = new Date(),
) => {
  const time = parseTime(timestamp);
  if (time === undefined) return "Unknown";
  const elapsed = Math.max(0, now.getTime() - time);
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR)
    return `${plural(Math.floor(elapsed / MINUTE), "minute")} ago`;
  if (elapsed < DAY) return `${plural(Math.floor(elapsed / HOUR), "hour")} ago`;
  if (elapsed < 2 * DAY) return "Yesterday";
  if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)} days ago`;
  if (elapsed < 365 * DAY)
    return `${plural(Math.floor(elapsed / (30 * DAY)), "month")} ago`;
  return `${plural(Math.floor(elapsed / (365 * DAY)), "year")} ago`;
};

export const formatAbsoluteTime = (timestamp: string | undefined) => {
  const time = parseTime(timestamp);
  return time === undefined ? "Unknown" : new Date(time).toLocaleString();
};

/** Sizes as displayed: "< 1 KB", "31 KB", "1.2 MB". */
export const formatSize = (bytes: number) => {
  if (bytes < 1024) return "< 1 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Sizes as announced: "less than 1 KB". */
export const formatAccessibleSize = (bytes: number) =>
  bytes < 1024 ? "less than 1 KB" : formatSize(bytes);

/** "A", "A and B", "A, B and C". */
export const formatList = (items: readonly string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
