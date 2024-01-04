import { describe, expect, it } from "vitest";
import { formatDate } from "../../src/date/formatter";
import { DateTimePattern } from "../../src/date/types";
import { DateTimeTableAttributes } from "@finos/vuu-table-types";

const testDate = new Date(2010, 5, 12, 15, 50, 37);

describe("formatDate", () => {
  it.each<{
    pattern: DateTimePattern;
    opts: DateTimeTableAttributes;
    expected: string;
  }>([
    {
      pattern: { date: "ddmmyyyy" },
      opts: { locale: "en-GB" },
      expected: "12/06/2010",
    },
    {
      pattern: { date: "ddMMMyyyy" },
      opts: { locale: "en-GB" },
      expected: "12 Jun 2010",
    },
    {
      pattern: { date: "ddMMMMyyyy" },
      opts: { locale: "en-GB" },
      expected: "12 June 2010",
    },
    {
      pattern: { date: "ddmmyyyy" },
      opts: { locale: "en-US" },
      expected: "06/12/2010",
    },
    {
      pattern: { date: "ddMMMyyyy" },
      opts: { locale: "en-US" },
      expected: "Jun 12, 2010",
    },
    {
      pattern: { date: "ddMMMMyyyy" },
      opts: { locale: "en-US" },
      expected: "June 12, 2010",
    },
    {
      pattern: { time: "hh:mm:ss" },
      opts: { locale: "en-GB" },
      expected: "15:50:37",
    },
    {
      pattern: { time: "hh:mm:ss a" },
      opts: { locale: "en-GB" },
      expected: "03:50:37 pm",
    },
    {
      pattern: { date: "ddmmyyyy", time: "hh:mm:ss a" },
      opts: { locale: "en-GB" },
      expected: "12/06/2010, 03:50:37 pm",
    },
    {
      pattern: { date: "ddMMMMyyyy", time: "hh:mm:ss a" },
      opts: { locale: "en-US" },
      expected: "June 12, 2010 at 03:50:37 PM",
    },
  ])(
    "can correctly format date with the given pattern $pattern and opts $opts",
    ({ pattern, opts, expected }) => {
      const actual = formatDate(pattern, opts)(testDate);
      expect(actual).toEqual(expected);
    }
  );
});
