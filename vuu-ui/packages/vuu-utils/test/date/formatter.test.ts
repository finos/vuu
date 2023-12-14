import { describe, expect, it } from "vitest";
import { formatDate } from "../../src/date/formatter";
import { DateTimePattern } from "../../src/date/types";

const testDate = new Date(2010, 5, 12, 15, 50, 37);

describe("formatDate", () => {
  it.each<{ pattern: DateTimePattern; expected: string }>([
    { pattern: "dd.mm.yyyy", expected: "12.06.2010" },
    { pattern: "dd/mm/yyyy", expected: "12/06/2010" },
    { pattern: "dd MMM yyyy", expected: "12 Jun 2010" },
    { pattern: "dd MMMM yyyy", expected: "12 June 2010" },
    { pattern: "mm/dd/yyyy", expected: "06/12/2010" },
    { pattern: "MMM dd, yyyy", expected: "Jun 12, 2010" },
    { pattern: "MMMM dd, yyyy", expected: "June 12, 2010" },
    { pattern: "hh:mm:ss", expected: "15:50:37" },
    { pattern: "hh:mm:ss a", expected: "03:50:37 pm" },
  ])(
    "can correctly format date with the given pattern $pattern",
    ({ pattern, expected }) => {
      const actual = formatDate(pattern)(testDate);
      expect(actual).toEqual(expected);
    }
  );
});
