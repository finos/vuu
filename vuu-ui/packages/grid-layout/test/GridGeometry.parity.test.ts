import { describe, expect, it } from "vitest";
import {
  LegacyGridCommandExecutor,
  type GridCommand,
} from "../src/GridCommand";
import {
  readTracks,
  regeneratePlaceholders,
  removeGridItem,
  replaceGridItem,
  resizeTrackTo,
  resizeTracksAdjacent,
  resizeTracksProportionally,
  splitGridItem,
  trackMetrics,
  trackSizes,
  type GridGeometry,
  type GridGeometryTrack,
} from "../src/GridGeometry";
import { GridLayoutModel } from "../src/GridLayoutModel";
import { GridModel, type TrackSize, type TrackType } from "../src/GridModel";
import { geometryCases } from "./geometry-cases";

/**
 * Differential characterization: for every geometry command in the case
 * battery, the geometry computed by the pure transition must match the
 * geometry read back from the hydrated legacy model.
 */

type ComparableGeometry = {
  columns: readonly TrackSize[];
  items: readonly string[];
  rows: readonly TrackSize[];
};

const comparable = ({
  columns,
  items,
  rows,
}: GridGeometry): ComparableGeometry => {
  const aliases = new Map<string, string>();
  let placeholder = 0;
  for (const { id, type } of items) {
    if (type === "placeholder") {
      aliases.set(id, `placeholder-${++placeholder}`);
    }
  }
  const alias = (id: string) => aliases.get(id) ?? id;
  return {
    columns,
    // Stack membership, and the lifecycle of the stacked-content wrapper, are
    // owned by the legacy model until stacks are extracted, so only geometry
    // is compared here.
    items: items
      .filter(({ type }) => type !== "stacked-content")
      .map(({ column, dragging, id, resizeable, row, type }) =>
        [
          alias(id),
          `${row.start}/${column.start}/${row.end}/${column.end}`,
          type,
          resizeable ?? false,
          dragging ? "dragging" : "",
        ].join(" "),
      ),
    rows,
  };
};

/**
 * Replicates the measurement input the executor hands to a resize command:
 * explicit measured sizes are recorded, and fractional tracks referenced by
 * the command are converted to pixels.
 */
const measuredTracks = (
  model: GridModel,
  trackType: TrackType,
  measuredSizes: readonly number[] | undefined,
  indices: readonly number[],
): readonly GridGeometryTrack[] => {
  const sizes = model.tracks
    .getTracks(trackType)
    .map(({ trackSize }) => trackSize);
  const measured = [...model.tracks.getTrackMetrics(trackType).measured];
  if (!measuredSizes) {
    return readTracks(sizes, trackMetrics(measured));
  }
  measuredSizes.forEach((size, index) => {
    measured[index] = size;
  });
  indices.forEach((index) => {
    if (sizes[index]?.endsWith("fr")) {
      sizes[index] = `${measured[index]}px`;
    }
  });
  return readTracks(sizes, trackMetrics(measured));
};

const withTracks = (
  geometry: GridGeometry,
  trackType: TrackType,
  tracks: readonly GridGeometryTrack[],
): GridGeometry =>
  trackType === "column"
    ? { ...geometry, columns: trackSizes(tracks) }
    : { ...geometry, rows: trackSizes(tracks) };

let placeholderCount = 0;
const createPlaceholderId = () => `pure-placeholder-${++placeholderCount}`;

const pureGeometryFor = (
  model: GridModel,
  geometry: GridGeometry,
  command: GridCommand,
): GridGeometry | undefined => {
  switch (command.type) {
    case "move-item": {
      const result = splitGridItem(
        geometry,
        {
          droppedItemId: command.itemId,
          splitDirection: command.position,
          targetItemId: command.targetId,
        },
        model.getMeasurements(),
      );
      return result.ok ? result.value.geometry : undefined;
    }
    case "replace-item": {
      const result = replaceGridItem(geometry, {
        droppedItemId: command.itemId,
        targetItemId: command.targetId,
      });
      return result.ok ? result.value.geometry : undefined;
    }
    case "remove-item":
    case "remove-stack-item": {
      const result = removeGridItem(
        geometry,
        {
          itemId: command.itemId,
          reason: command.type === "remove-item" ? command.reason : "close",
        },
        {
          createPlaceholderId,
          measurements: model.getMeasurements(),
        },
      );
      return result.ok ? result.value.geometry : undefined;
    }
    case "regenerate-placeholders":
      return regeneratePlaceholders(geometry, createPlaceholderId).geometry;
    case "resize-track": {
      const result = resizeTrackTo(
        measuredTracks(model, command.track, undefined, [command.index]),
        command.index,
        command.size,
        command.track,
      );
      return result.ok
        ? withTracks(geometry, command.track, result.value.tracks)
        : undefined;
    }
    case "resize-tracks": {
      const indices =
        command.distribution === "adjacent"
          ? [command.resizedTrackIndex, command.contraTrackIndex]
          : [...command.beforeTrackIndices, ...command.afterTrackIndices];
      const tracks = measuredTracks(
        model,
        command.track,
        command.measuredSizes,
        indices,
      );
      const result =
        command.distribution === "adjacent"
          ? resizeTracksAdjacent(
              tracks,
              {
                contraTrackIndex: command.contraTrackIndex,
                delta: command.delta,
                resizedTrackIndex: command.resizedTrackIndex,
              },
              command.track,
            )
          : resizeTracksProportionally(
              tracks,
              {
                afterConstraints: command.afterConstraints?.map(
                  ({ minimum, trackIndices }) => ({ minimum, trackIndices }),
                ),
                afterTrackIndices: command.afterTrackIndices,
                beforeConstraints: command.beforeConstraints?.map(
                  ({ minimum, trackIndices }) => ({ minimum, trackIndices }),
                ),
                beforeTrackIndices: command.beforeTrackIndices,
                delta: command.delta,
                initialSizes: command.initialSizes,
              },
              command.track,
            );
      return result.ok
        ? withTracks(geometry, command.track, result.value.tracks)
        : undefined;
    }
    default:
      return undefined;
  }
};

const GEOMETRY_COMMANDS = new Set<GridCommand["type"]>([
  "move-item",
  "regenerate-placeholders",
  "remove-item",
  "remove-stack-item",
  "replace-item",
  "resize-track",
  "resize-tracks",
]);

let comparedTransitions = 0;

describe("grid geometry differential parity", () => {
  it.each(
    geometryCases.map(({ name }) => name),
  )("pure transitions match the hydrated model for %s", (name) => {
    const geometryCase = geometryCases.find(
      (candidate) => candidate.name === name,
    );
    expect(geometryCase).toBeDefined();
    if (!geometryCase) {
      return;
    }
    placeholderCount = 0;
    const model = new GridModel(
      `parity-${name}`,
      structuredClone(geometryCase.initial),
    );
    const layoutModel = new GridLayoutModel(model);
    const executor = new LegacyGridCommandExecutor(model, layoutModel);

    for (const step of geometryCase.steps) {
      const command = step(model);
      const before = model.toGeometry();
      const expected = pureGeometryFor(model, before, command);
      const result = executor.execute(command);
      if (!GEOMETRY_COMMANDS.has(command.type)) {
        continue;
      }
      if (result.ok) {
        expect(
          expected,
          `${command.type} produced no pure geometry`,
        ).toBeDefined();
        if (expected) {
          comparedTransitions += 1;
          expect(comparable(model.toGeometry())).toEqual(comparable(expected));
        }
      } else {
        // a rejected command must leave the model untouched
        expect(comparable(model.toGeometry())).toEqual(comparable(before));
      }
    }
  });

  it("compares every geometry family", () => {
    expect(comparedTransitions).toBeGreaterThan(30);
  });
});
