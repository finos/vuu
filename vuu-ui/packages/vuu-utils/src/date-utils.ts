//TODO - hpow are we going to approach data formatting toLocaleDateString ? Temporal ?
export type DatePattern = "dd.mm.yyyy";

export const isValidDatePattern = (pattern?: string): pattern is DatePattern =>
  pattern === "dd.mm.yyyy";

const leadZero = (digit: number) => {
  return digit < 10 ? `0` + digit : digit.toString();
};

export const formatDate = (date: Date, format: DatePattern = "dd.mm.yyyy") => {
  if (format) {
    const dd = date.getDate();
    const mm = date.getMonth();
    const yyyy = date.getFullYear();
    return `${leadZero(dd)}.${leadZero(mm + 1)}.${yyyy}`;
  } else {
    return date.toUTCString();
  }
};
