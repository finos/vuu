import { describe, expect, it } from "vitest";
import {
  InvalidStateDocumentError,
  validateStateDocument,
} from "../../src/persistence";
import {
  cloneJson,
  createStateDocument,
  deepFreeze,
  findNonJsonValue,
  isEmptyStateDocument,
  jsonEqual,
} from "../../src/persistence/StateDocument";
import { entry, stateDocument } from "./test-utils";

describe("validateStateDocument", () => {
  it("accepts a well-formed document", () => {
    const document = stateDocument({
      applicationKey: "orders",
      applicationVersion: 2,
      applicationTitle: "Orders",
      carriedForwardFrom: 1,
      migrationsApplied: [2],
      notCarriedForward: [
        { key: "old", fromVersion: 1, reason: "Removed", label: "Old" },
      ],
      entries: {
        "table/sort": entry([{ column: "price", direction: "D" }], {
          label: "Sort",
          group: "Table",
          formatVersion: 2,
        }),
      },
    });
    expect(validateStateDocument(document)).toEqual(document);
  });

  it.each([
    ["not an object", 42],
    ["an array", []],
    [
      "missing user",
      {
        ...stateDocument({ applicationKey: "a", applicationVersion: 1 }),
        user: "",
      },
    ],
    [
      "non-integer version",
      stateDocument({ applicationKey: "a", applicationVersion: 1.5 }),
    ],
    [
      "missing entries",
      {
        ...stateDocument({ applicationKey: "a", applicationVersion: 1 }),
        entries: undefined,
      },
    ],
    [
      "an entry without a value",
      stateDocument({
        applicationKey: "a",
        applicationVersion: 1,
        entries: { x: { updatedAt: "now" } as never },
      }),
    ],
    [
      "a bad notCarriedForward record",
      stateDocument({
        applicationKey: "a",
        applicationVersion: 1,
        notCarriedForward: [{ key: "x" } as never],
      }),
    ],
  ])("rejects %s", (_, value) => {
    expect(() => validateStateDocument(value)).toThrow(
      InvalidStateDocumentError,
    );
  });

  it("rejects documents that don't match the expected reference", () => {
    const document = stateDocument({
      applicationKey: "a",
      applicationVersion: 1,
    });
    expect(() =>
      validateStateDocument(document, { applicationKey: "b" }),
    ).toThrow(InvalidStateDocumentError);
    expect(() =>
      validateStateDocument(document, { user: "someone-else" }),
    ).toThrow(InvalidStateDocumentError);
    expect(() =>
      validateStateDocument(document, { applicationVersion: 2 }),
    ).toThrow(InvalidStateDocumentError);
  });

  it("flags documents from a newer schema as unsupported, not corrupt", () => {
    const document = {
      ...stateDocument({ applicationKey: "a", applicationVersion: 1 }),
      schemaVersion: 99,
    };
    try {
      validateStateDocument(document);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStateDocumentError);
      expect((error as InvalidStateDocumentError).unsupportedSchema).toBe(true);
    }
  });
});

describe("JSON value helpers", () => {
  it("finds values that aren't JSON", () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(findNonJsonValue({ a: [1, "x", null, true] })).toBeUndefined();
    expect(findNonJsonValue(undefined)).toBeDefined();
    expect(findNonJsonValue({ a: () => 1 })).toBeDefined();
    expect(findNonJsonValue({ a: new Date() })).toBeDefined();
    expect(findNonJsonValue({ a: Number.NaN })).toBeDefined();
    expect(findNonJsonValue(cycle)).toBeDefined();
  });

  it("compares, clones and freezes", () => {
    const value = { a: [1, { b: 2 }] };
    const copy = cloneJson(value);
    expect(copy).not.toBe(value);
    expect(jsonEqual(copy, value)).toBe(true);
    expect(jsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(jsonEqual({ a: 1 }, { a: 2 })).toBe(false);
    const frozen = deepFreeze(copy);
    expect(Object.isFrozen(frozen.a[1])).toBe(true);
  });

  it("creates empty documents", () => {
    const document = createStateDocument({
      user: "steve",
      applicationKey: "a",
      applicationVersion: 3,
      now: "t",
    });
    expect(document).toMatchObject({
      schemaVersion: 1,
      revision: 0,
      createdAt: "t",
      entries: {},
    });
    expect(isEmptyStateDocument(document)).toBe(true);
  });
});
