import { describe, expect, it } from "vitest";
import characterization from "./__fixtures__/grid-geometry-characterization.json";
import {
  captureGeometryCase,
  geometryCases,
  type GeometryCaseCapture,
} from "./geometry-cases";

const expectedCaptures = characterization as unknown as GeometryCaseCapture[];

/**
 * The fixture was captured from the legacy mutable engine before geometry was
 * extracted into pure transitions. Every geometry family must keep producing
 * exactly the same canonical state, splitters and typed command results.
 */
describe("grid geometry characterization", () => {
  it("covers every case exactly once", () => {
    expect(expectedCaptures.map(({ name }) => name)).toEqual(
      geometryCases.map(({ name }) => name),
    );
  });

  it.each(
    geometryCases.map((geometryCase) => geometryCase.name),
  )("preserves canonical geometry for %s", (name) => {
    const geometryCase = geometryCases.find(
      (candidate) => candidate.name === name,
    );
    const expected = expectedCaptures.find(
      (candidate) => candidate.name === name,
    );
    expect(geometryCase).toBeDefined();
    expect(expected).toBeDefined();
    if (!geometryCase || !expected) {
      return;
    }
    expect(
      JSON.parse(JSON.stringify(captureGeometryCase(geometryCase))),
    ).toEqual(expected);
  });
});
