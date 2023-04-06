//TODO - hpow are we going to approach data formatting toLocaleDateString ? Temporal ?

export type DatePattern = "dd.mm.yyyy";
export type TimePattern = "kk:mm:ss";
export type DateTimePattern = DatePattern | TimePattern;

export const isDatePattern = (pattern?: string): pattern is DatePattern =>
  pattern === "dd.mm.yyyy";
export const isTimePattern = (pattern?: string): pattern is TimePattern =>
  pattern === "kk:mm:ss";
export const isDateTimePattern = (
  pattern?: string
): pattern is DateTimePattern =>
  (pattern !== undefined && isDatePattern(pattern)) || isTimePattern(pattern);

const leadZero = (digit: number) => {
  return digit < 10 ? `0` + digit : digit.toString();
};

export const formatDate = (
  date: Date,
  format: DateTimePattern = "dd.mm.yyyy"
) => {
  if (isDatePattern(format)) {
    const dd = date.getDate();
    const mm = date.getMonth();
    const yyyy = date.getFullYear();
    return `${leadZero(dd)}.${leadZero(mm + 1)}.${yyyy}`;
  } else if (isTimePattern(format)) {
    const hh = date.getHours();
    const mm = date.getMinutes();
    const ss = date.getSeconds();
    return `${leadZero(hh)}:${leadZero(mm)}:${leadZero(ss)}`;
  } else {
    return date.toUTCString();
  }
};
