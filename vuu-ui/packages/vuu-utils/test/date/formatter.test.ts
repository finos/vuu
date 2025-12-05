import { describe, expect, it } from "vitest";
import { formatDate } from "../../src/date/formatter";
import { DateTimePattern } from "../../src/date/types";

const testDate = new Date(2010, 5, 12, 15, 50, 37, 159);

describe("formatDate", () => {
  it.each<{ pattern: DateTimePattern; expected: string }>([
    { pattern: { date: "dd.mm.yyyy" }, expected: "12.06.2010" },
    { pattern: { date: "dd/mm/yyyy" }, expected: "12/06/2010" },
    { pattern: { date: "dd MMM yyyy" }, expected: "12 Jun 2010" },
    { pattern: { date: "dd MMMM yyyy" }, expected: "12 June 2010" },
    { pattern: { date: "mm/dd/yyyy" }, expected: "06/12/2010" },
    { pattern: { date: "MMM dd, yyyy" }, expected: "Jun 12, 2010" },
    { pattern: { date: "MMMM dd, yyyy" }, expected: "June 12, 2010" },
    { pattern: { time: "hh:mm:ss" }, expected: "15:50:37" },
    { pattern: { time: "hh:mm:ss a" }, expected: "03:50:37 pm" },
    { pattern: { time: "hh:mm:ss.ms" }, expected: "15:50:37.159" },
    {
      pattern: { date: "dd.mm.yyyy", time: "hh:mm:ss a" },
      expected: "12.06.2010 03:50:37 pm",
    },
    {
      pattern: { date: "MMMM dd, yyyy", time: "hh:mm:ss a" },
      expected: "June 12, 2010 03:50:37 pm",
    },
    {
      pattern: { date: "MMMM dd, yyyy", time: "hh:mm:ss.ms" },
      expected: "June 12, 2010 15:50:37.159",
    },
  ])(
    "can correctly format date with the given pattern $pattern",
    ({ pattern, expected }) => {
      const actual = formatDate(pattern)(testDate);
      expect(actual).toEqual(expected);
    },
  );
});
describe("formatDateWithISO", () => {
  it.each<{ pattern: DateTimePattern; expected: string }>([
    { pattern: { date: "yyyy-mm-dd" }, expected: "2010-06-12" },
    {
      pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss a" },
      expected: "2010-06-12 03:50:37 pm",
    },
    {
      pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss.ms" },
      expected: "2010-06-12 15:50:37.159",
    },
  ])(
    "can correctly format date with the given pattern $pattern",
    ({ pattern, expected }) => {
      const actual = formatDate(pattern)(testDate);
      expect(actual).toEqual(expected);
    },
  );
});
