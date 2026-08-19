import type {
  GridItemId,
  GridItemResizeable,
  GridTrackSize,
} from "./GridSnapshot";

/**
 * Pure, immutable grid geometry.
 *
 * This module owns every geometry and track transition algorithm used by the
 * grid layout. It is deliberately free of DOM, React, EventEmitter and mutable
 * model dependencies; all browser/runtime measurement enters through the
 * explicit, immutable {@link TrackMetrics} input.
 *
 * Callers read an immutable {@link GridGeometry} plus {@link TrackMetrics} from
 * whatever runtime representation they own, invoke a transition, then hydrate
 * the result back into that representation.
 */

export type GridGeometryTrackType = "column" | "row";
export type GridGeometryItemType =
  | "content"
  | "placeholder"
  | "splitter"
  | "stacked-content";
export type GridGeometrySplitDirection = "north" | "south" | "east" | "west";
export type GridGeometryResizeDirection = "horizontal" | "vertical";
export type GridGeometryAssignDirection = "bwd" | "fwd";
export type GridGeometryRemoveReason =
  | "drag"
  | "close"
  | "placeholder"
  | "unstack";
export type GridGeometryTrackInsertPosition = "after" | "before";

export interface GridGeometrySpan {
  readonly end: number;
  readonly start: number;
}

export interface GridGeometryItem {
  readonly column: GridGeometrySpan;
  readonly dragging?: boolean;
  readonly id: GridItemId;
  readonly resizeable?: GridItemResizeable;
  readonly row: GridGeometrySpan;
  readonly stackId?: string;
  readonly type: GridGeometryItemType;
}

export interface GridGeometry {
  readonly columns: readonly GridTrackSize[];
  readonly items: readonly GridGeometryItem[];
  readonly rows: readonly GridTrackSize[];
}

/**
 * Explicit measurement input. `measured[i]` is the measured pixel size of
 * track `i`, or -1 when that track has not been measured. Geometry functions
 * never measure; when a transition needs a measurement it does not have, it
 * fails with MEASUREMENT_REQUIRED and the caller re-measures and retries.
 */
export interface TrackMetrics {
  readonly measured: readonly number[];
}

export const NO_TRACK_METRICS: TrackMetrics = { measured: [] };

export const trackMetrics = (measured: readonly number[]): TrackMetrics => ({
  measured: [...measured],
});

/** Measurement input for both track types. */
export interface GridMeasurements {
  readonly column?: TrackMetrics;
  readonly row?: TrackMetrics;
}

export const NO_MEASUREMENTS: GridMeasurements = {};

/**
 * The immutable state of a single track: its css size, plus the measured
 * pixel value carried alongside it (-1 when unmeasured).
 */
export interface GridGeometryTrack {
  readonly measured: number;
  readonly size: GridTrackSize;
}

/**
 * The result of a track transition. `sources[i]` is the index of the track in
 * the previous track list that new track `i` derives from, or -1 for a track
 * that did not previously exist.
 */
export interface GridTrackTransition {
  readonly sources: readonly number[];
  readonly tracks: readonly GridGeometryTrack[];
}

export interface GridGeometryUpdate {
  readonly column?: GridGeometrySpan;
  readonly id: GridItemId;
  readonly row?: GridGeometrySpan;
}

export interface GridGeometryRemoval {
  readonly id: GridItemId;
  readonly reason: GridGeometryRemoveReason;
}

export type GridGeometryErrorCode =
  | "GEOMETRY_ERROR"
  | "INVALID_ITEM"
  | "INVALID_TARGET"
  | "ITEM_NOT_FOUND"
  | "MEASUREMENT_REQUIRED"
  | "NON_RESIZABLE"
  | "TRACK_NOT_FOUND";

export interface GridGeometryError {
  readonly code: GridGeometryErrorCode;
  readonly message: string;
  readonly trackType?: GridGeometryTrackType;
}

export type GridGeometryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly error: GridGeometryError; readonly ok: false };

const ok = <T>(value: T): GridGeometryResult<T> => ({ ok: true, value });

const failure = <T>(
  code: GridGeometryErrorCode,
  message: string,
  trackType?: GridGeometryTrackType,
): GridGeometryResult<T> => ({
  error: { code, message, trackType },
  ok: false,
});

const measurementRequired = <T>(trackType: GridGeometryTrackType) =>
  failure<T>(
    "MEASUREMENT_REQUIRED",
    `[GridGeometry] ${trackType} tracks must be measured before this transition`,
    trackType,
  );

// ---------------------------------------------------------------------------
// track values
// ---------------------------------------------------------------------------

export const isFractionTrackSize = (size: GridTrackSize) =>
  typeof size === "string" && size.endsWith("fr");

export const isPixelTrackSize = (size: GridTrackSize) =>
  typeof size === "string" && size.endsWith("px");

const fractionSize = (value: number) => `${value}fr` as GridTrackSize;
const pixelSize = (value: number) => `${value}px` as GridTrackSize;

const isFraction = ({ size }: GridGeometryTrack) => isFractionTrackSize(size);
const isPixelValue = ({ size }: GridGeometryTrack) => isPixelTrackSize(size);
const isMeasured = ({ measured }: GridGeometryTrack) => measured !== -1;

const hasNumericValue = (track: GridGeometryTrack) =>
  isPixelValue(track) || isMeasured(track);

const numericValue = (track: GridGeometryTrack) =>
  isPixelValue(track) ? parseFloat(track.size) : track.measured;

const sizedTrack = (size: GridTrackSize): GridGeometryTrack => ({
  measured: -1,
  size,
});

/**
 * Port of the legacy GridTrack#increment. A fractional track must have been
 * measured before it can be incremented; it is converted to pixels first,
 * retaining its measured value.
 */
const incrementTrack = (
  track: GridGeometryTrack,
  value: number,
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridGeometryTrack> => {
  if (isFraction(track)) {
    if (!isMeasured(track)) {
      return measurementRequired(trackType);
    }
    return ok({
      measured: track.measured,
      size: pixelSize(track.measured + value),
    });
  }
  return ok({
    measured: track.measured,
    size: pixelSize(parseFloat(track.size) + value),
  });
};

export const readTracks = (
  sizes: readonly GridTrackSize[],
  metrics: TrackMetrics = NO_TRACK_METRICS,
): readonly GridGeometryTrack[] =>
  sizes.map((size, index) => ({
    measured: metrics.measured[index] ?? -1,
    size,
  }));

export const trackSizes = (tracks: readonly GridGeometryTrack[]) =>
  tracks.map(({ size }) => size);

export const geometryTracks = (
  geometry: GridGeometry,
  trackType: GridGeometryTrackType,
) => (trackType === "column" ? geometry.columns : geometry.rows);

const identitySources = (length: number) =>
  Array.from({ length }, (_, index) => index);

const transition = (
  tracks: readonly GridGeometryTrack[],
  sources: readonly number[],
): GridTrackTransition => ({ sources: [...sources], tracks: [...tracks] });

/**
 * Compose a follow-on track transition onto an existing one, so that a
 * multi-step transition still reports a single mapping back to the tracks that
 * the transition started from.
 */
const composeTransitions = (
  first: GridTrackTransition | undefined,
  second: GridTrackTransition,
): GridTrackTransition =>
  first === undefined
    ? second
    : {
        sources: second.sources.map((source) =>
          source === -1 ? -1 : (first.sources[source] ?? -1),
        ),
        tracks: second.tracks,
      };

// ---------------------------------------------------------------------------
// track transitions
// ---------------------------------------------------------------------------

/** Split a single track into two equally sized tracks. */
export const splitTrack = (
  tracks: readonly GridGeometryTrack[],
  trackIndex: number,
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridTrackTransition> => {
  const targetTrack = tracks[trackIndex];
  if (targetTrack === undefined) {
    return failure(
      "TRACK_NOT_FOUND",
      `[GridGeometry] no ${trackType} track #${trackIndex}`,
    );
  }
  const sources = identitySources(tracks.length);
  if (isFraction(targetTrack)) {
    const splitTrackSize = targetTrack.size;
    const doubled = tracks.map((track) =>
      isFraction(track)
        ? sizedTrack(fractionSize(parseFloat(track.size) * 2))
        : track,
    );
    doubled[trackIndex] = sizedTrack(splitTrackSize);
    return ok(
      transition(
        [
          ...doubled.slice(0, trackIndex),
          { measured: -1, size: splitTrackSize },
          ...doubled.slice(trackIndex),
        ],
        [...sources.slice(0, trackIndex), -1, ...sources.slice(trackIndex)],
      ),
    );
  }

  const sizeOfNewTrack = Math.floor(numericValue(targetTrack) / 2);
  const reduced = incrementTrack(targetTrack, -sizeOfNewTrack, trackType);
  if (!reduced.ok) {
    return reduced;
  }
  const next = [...tracks];
  next[trackIndex] = reduced.value;
  return ok(
    transition(
      [
        ...next.slice(0, trackIndex),
        { measured: -1, size: pixelSize(sizeOfNewTrack) },
        ...next.slice(trackIndex),
      ],
      [...sources.slice(0, trackIndex), -1, ...sources.slice(trackIndex)],
    ),
  );
};

/**
 * Find an existing grid line that exactly bisects the given track range,
 * returning -1 when the range cannot be bisected by an existing line.
 */
export const findBisectingTrack = (
  tracks: readonly GridGeometryTrack[],
  startIndex: number,
  endIndex: number,
  trackType: GridGeometryTrackType,
): GridGeometryResult<number> => {
  const tracksInRange = tracks.slice(startIndex - 1, endIndex);
  if (tracksInRange.every(isFraction)) {
    const halfSize =
      tracksInRange.reduce((sum, track) => sum + parseFloat(track.size), 0) / 2;
    let size = 0;
    for (let i = startIndex - 1; i < endIndex - 1; i++) {
      size += parseFloat(tracks[i].size);
      if (Math.abs(halfSize - size) < Number.EPSILON) {
        return ok(i + 2);
      }
    }
    return ok(-1);
  }
  if (!tracksInRange.every(hasNumericValue)) {
    return measurementRequired(trackType);
  }

  let size = 0;
  for (let i = startIndex - 1; i < endIndex - 1; i++) {
    size += numericValue(tracks[i]);
  }
  const halfSize = size / 2;

  size = 0;
  for (let i = startIndex - 1; i < endIndex - 1; i++) {
    size += numericValue(tracks[i]);
    if (Math.abs(halfSize - size) < 1) {
      return ok(i + 2);
    }
  }
  return ok(-1);
};

export interface GridTrackBisection {
  readonly newTrackIndex: number;
  readonly transition: GridTrackTransition;
}

/**
 * Create a new grid line that bisects the tracks between two grid lines.
 */
export const bisectTracks = (
  tracks: readonly GridGeometryTrack[],
  fromTrackLine: number,
  toTrackLine: number,
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridTrackBisection> => {
  const rangeStart = fromTrackLine - 1;
  const rangeEnd = toTrackLine - 1;
  const tracksInRange = tracks.slice(rangeStart, rangeEnd);
  const sources = identitySources(tracks.length);

  if (tracksInRange.every(isFraction)) {
    const halfSize =
      tracksInRange.reduce((sum, track) => sum + parseFloat(track.size), 0) / 2;
    let size = 0;
    for (let i = rangeStart; i < rangeEnd; i++) {
      const trackSize = parseFloat(tracks[i].size);
      if (size + trackSize > halfSize) {
        const firstSize = halfSize - size;
        const secondSize = trackSize - firstSize;
        return ok({
          newTrackIndex: i,
          transition: transition(
            [
              ...tracks.slice(0, i),
              { measured: -1, size: fractionSize(firstSize) },
              { measured: -1, size: fractionSize(secondSize) },
              ...tracks.slice(i + 1),
            ],
            [...sources.slice(0, i), -1, -1, ...sources.slice(i + 1)],
          ),
        });
      }
      size += trackSize;
    }
    return failure(
      "GEOMETRY_ERROR",
      "[GridTracks] fractional tracks could not be bisected",
      trackType,
    );
  }

  if (!tracksInRange.every(hasNumericValue)) {
    return measurementRequired(trackType);
  }

  let newTrackIndex = 0;
  const newTracks: GridGeometryTrack[] = [];
  const newSources: number[] = [];

  let size = 0;
  for (let i = fromTrackLine - 1; i < toTrackLine - 1; i++) {
    size += numericValue(tracks[i]);
  }
  let halfTrack = Math.floor(size / 2);
  for (let i = 0; i < tracks.length; i++) {
    if (i < fromTrackLine - 1) {
      newTracks.push(tracks[i]);
      newSources.push(i);
    } else if (i < toTrackLine - 1) {
      const trackValue = numericValue(tracks[i]);
      if (trackValue < halfTrack) {
        newTracks.push(tracks[i]);
        newSources.push(i);
        halfTrack -= trackValue;
      } else if (halfTrack) {
        newTrackIndex = newTracks.length;
        newTracks.push({ measured: -1, size: pixelSize(halfTrack) });
        newSources.push(-1);
        newTracks.push({
          measured: -1,
          size: pixelSize(trackValue - halfTrack),
        });
        newSources.push(-1);
        halfTrack = 0;
      } else {
        newTracks.push(tracks[i]);
        newSources.push(i);
      }
    } else {
      newTracks.push(tracks[i]);
      newSources.push(i);
    }
  }

  return ok({
    newTrackIndex,
    transition: transition(newTracks, newSources),
  });
};

/**
 * Insert a new pixel track, reducing the track it displaces by the same
 * amount. The insertion is a no-op when there is no track to reduce.
 */
export const insertTrack = (
  tracks: readonly GridGeometryTrack[],
  {
    index,
    position,
  }: { index: number; position: GridGeometryTrackInsertPosition },
  size: number,
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridTrackTransition | undefined> => {
  const reducedIndex = position === "before" ? index - 1 : index;
  const reducedTrack = tracks[reducedIndex];
  if (reducedTrack === undefined) {
    return ok(undefined);
  }
  const reduced = incrementTrack(reducedTrack, -size, trackType);
  if (!reduced.ok) {
    return reduced;
  }
  const next = [...tracks];
  next[reducedIndex] = reduced.value;
  const sources = identitySources(tracks.length);
  return ok(
    transition(
      [
        ...next.slice(0, index),
        { measured: -1, size: pixelSize(Math.abs(size)) },
        ...next.slice(index),
      ],
      [...sources.slice(0, index), -1, ...sources.slice(index)],
    ),
  );
};

/**
 * Remove a track, assigning its size to the adjacent (contra) track.
 */
export const removeTrack = (
  tracks: readonly GridGeometryTrack[],
  index: number,
  assignDirection: GridGeometryAssignDirection = "fwd",
  trackType: GridGeometryTrackType = "column",
): GridGeometryResult<GridTrackTransition> => {
  const assignFwd = index === 0 || assignDirection === "fwd";
  const contraIndex = assignFwd ? index + 1 : index - 1;
  const contraTrack = tracks[contraIndex];
  const removedTrack = tracks[index];

  if (contraTrack === undefined || removedTrack === undefined) {
    return failure(
      "TRACK_NOT_FOUND",
      `[GridGeometry] no ${trackType} track to absorb removal of track #${index}`,
      trackType,
    );
  }

  const otherTracksAreFractions = tracks.some(
    (track, i) => i !== index && i !== contraIndex && isFraction(track),
  );

  let nextContraTrack = contraTrack;
  if (isFraction(contraTrack) && isFraction(removedTrack)) {
    if (otherTracksAreFractions) {
      nextContraTrack = {
        measured: contraTrack.measured,
        size: fractionSize(
          parseFloat(contraTrack.size) + parseFloat(removedTrack.size),
        ),
      };
    }
  } else if (isFraction(contraTrack)) {
    if (otherTracksAreFractions) {
      if (!isMeasured(contraTrack) || !hasNumericValue(removedTrack)) {
        return measurementRequired(trackType);
      }
      const incremented = incrementTrack(
        contraTrack,
        numericValue(removedTrack),
        trackType,
      );
      if (!incremented.ok) {
        return incremented;
      }
      nextContraTrack = incremented.value;
    }
  } else {
    if (!hasNumericValue(removedTrack)) {
      return measurementRequired(trackType);
    }
    const incremented = incrementTrack(
      contraTrack,
      numericValue(removedTrack),
      trackType,
    );
    if (!incremented.ok) {
      return incremented;
    }
    nextContraTrack = incremented.value;
  }

  const next = [...tracks];
  next[contraIndex] = nextContraTrack;
  const sources = identitySources(tracks.length);
  next.splice(index, 1);
  sources.splice(index, 1);
  return ok(transition(next, sources));
};

/** Set an explicit size for a single track. */
export const resizeTrackTo = (
  tracks: readonly GridGeometryTrack[],
  trackIndex: number,
  size: GridTrackSize,
  trackType: GridGeometryTrackType = "column",
): GridGeometryResult<GridTrackTransition> => {
  if (tracks[trackIndex] === undefined) {
    return failure(
      "TRACK_NOT_FOUND",
      `[GridGeometry] no ${trackType} track #${trackIndex}`,
      trackType,
    );
  }
  const next = [...tracks];
  next[trackIndex] = sizedTrack(size);
  return ok(transition(next, identitySources(tracks.length)));
};

/** Grow one track by `value`, shrinking its contra track by the same amount. */
export const resizeTracksAdjacent = (
  tracks: readonly GridGeometryTrack[],
  {
    contraTrackIndex,
    delta,
    resizedTrackIndex,
  }: {
    contraTrackIndex: number;
    delta: number;
    resizedTrackIndex: number;
  },
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridTrackTransition> => {
  const resizeTrack = tracks[resizedTrackIndex];
  const contraTrack = tracks[contraTrackIndex];
  if (resizeTrack === undefined || contraTrack === undefined) {
    return failure(
      "TRACK_NOT_FOUND",
      "[GridTracks] resize, no track at index position",
      trackType,
    );
  }
  const resized = incrementTrack(resizeTrack, delta, trackType);
  if (!resized.ok) {
    return resized;
  }
  const contra = incrementTrack(contraTrack, -delta, trackType);
  if (!contra.ok) {
    return contra;
  }
  const next = [...tracks];
  next[resizedTrackIndex] = resized.value;
  next[contraTrackIndex] = contra.value;
  return ok(transition(next, identitySources(tracks.length)));
};

export interface GridGeometryResizeConstraint {
  readonly minimum: number;
  readonly trackIndices: readonly number[];
}

export interface GridProportionalResize {
  readonly afterConstraints?: readonly GridGeometryResizeConstraint[];
  readonly afterTrackIndices: readonly number[];
  readonly beforeConstraints?: readonly GridGeometryResizeConstraint[];
  readonly beforeTrackIndices: readonly number[];
  readonly delta: number;
  readonly initialSizes?: readonly number[];
}

/**
 * Distribute the minimum size required by a set of aggregate constraints
 * across the tracks they cover.
 */
const getMinimumConstrainedSizes = (
  trackIndices: readonly number[],
  constraints: readonly GridGeometryResizeConstraint[],
) => {
  const prefixSizes = Array.from({ length: trackIndices.length + 1 }, () => 0);
  for (let end = 1; end <= trackIndices.length; end += 1) {
    prefixSizes[end] = prefixSizes[end - 1];
    for (const constraint of constraints) {
      const localIndices = constraint.trackIndices
        .map((trackIndex) => trackIndices.indexOf(trackIndex))
        .filter((index) => index !== -1)
        .sort((a, b) => a - b);
      if (localIndices.at(-1) === end - 1) {
        prefixSizes[end] = Math.max(
          prefixSizes[end],
          prefixSizes[localIndices[0]] + constraint.minimum,
        );
      }
    }
  }
  return trackIndices.map(
    (_, index) => prefixSizes[index + 1] - prefixSizes[index],
  );
};

const getConstrainedGroupReductions = (
  tracks: readonly GridGeometryTrack[],
  trackIndices: readonly number[],
  constraints: readonly GridGeometryResizeConstraint[],
  requestedReduction: number,
) => {
  const reductions = trackIndices.map(() => 0);
  const initialSizes = trackIndices.map((trackIndex) =>
    numericValue(tracks[trackIndex]),
  );
  if (
    constraints.some(
      (constraint) =>
        constraint.trackIndices.reduce(
          (total, trackIndex) => total + numericValue(tracks[trackIndex]),
          0,
        ) <
        constraint.minimum - 0.001,
    )
  ) {
    return reductions;
  }
  const minimumSizes = getMinimumConstrainedSizes(trackIndices, constraints);
  const maximumReduction = Math.max(
    0,
    initialSizes.reduce((total, size) => total + size, 0) -
      minimumSizes.reduce((total, size) => total + size, 0),
  );
  const allConstraints = constraints.concat(
    trackIndices.map((trackIndex) => ({
      minimum: 0,
      trackIndices: [trackIndex],
    })),
  );
  let activeTrackIndices = [...trackIndices];
  let remainingReduction = Math.min(requestedReduction, maximumReduction);

  while (remainingReduction > 0.001 && activeTrackIndices.length > 0) {
    const activeSize = activeTrackIndices.reduce(
      (total, trackIndex) =>
        total +
        numericValue(tracks[trackIndex]) -
        reductions[trackIndices.indexOf(trackIndex)],
      0,
    );
    const proposedReductions = activeTrackIndices.map((trackIndex) => {
      const currentSize =
        numericValue(tracks[trackIndex]) -
        reductions[trackIndices.indexOf(trackIndex)];
      return remainingReduction * (currentSize / activeSize);
    });
    let appliedRatio = 1;

    for (const constraint of allConstraints) {
      const constrainedActiveIndices = activeTrackIndices.filter((trackIndex) =>
        constraint.trackIndices.includes(trackIndex),
      );
      const proposedReduction = constrainedActiveIndices.reduce(
        (total, trackIndex) =>
          total + proposedReductions[activeTrackIndices.indexOf(trackIndex)],
        0,
      );
      if (proposedReduction === 0) {
        continue;
      }
      const currentSize = constraint.trackIndices.reduce(
        (total, trackIndex) =>
          total +
          numericValue(tracks[trackIndex]) -
          reductions[trackIndices.indexOf(trackIndex)],
        0,
      );
      appliedRatio = Math.min(
        appliedRatio,
        Math.max(0, (currentSize - constraint.minimum) / proposedReduction),
      );
    }

    let appliedReduction = 0;
    activeTrackIndices.forEach((trackIndex, index) => {
      const reduction = proposedReductions[index] * appliedRatio;
      reductions[trackIndices.indexOf(trackIndex)] += reduction;
      appliedReduction += reduction;
    });
    remainingReduction -= appliedReduction;
    if (appliedRatio === 1) {
      break;
    }

    activeTrackIndices = activeTrackIndices.filter((trackIndex) =>
      allConstraints.every((constraint) => {
        if (!constraint.trackIndices.includes(trackIndex)) {
          return true;
        }
        const currentSize = constraint.trackIndices.reduce(
          (total, constrainedTrackIndex) =>
            total +
            numericValue(tracks[constrainedTrackIndex]) -
            reductions[trackIndices.indexOf(constrainedTrackIndex)],
          0,
        );
        return currentSize - constraint.minimum > 0.001;
      }),
    );
  }
  if (remainingReduction > 0.001) {
    const currentSizes = initialSizes.map(
      (size, index) => size - reductions[index],
    );
    const availableReduction =
      currentSizes.reduce((total, size) => total + size, 0) -
      minimumSizes.reduce((total, size) => total + size, 0);
    const interpolation =
      availableReduction > 0
        ? Math.min(1, remainingReduction / availableReduction)
        : 0;
    currentSizes.forEach((size, index) => {
      const finalSize = size + (minimumSizes[index] - size) * interpolation;
      reductions[index] = initialSizes[index] - finalSize;
    });
  }
  return reductions;
};

/**
 * The total reduction that a group of tracks can absorb without violating
 * its minimum size constraints.
 */
export const getProportionalResizeAllowance = (
  tracks: readonly GridGeometryTrack[],
  trackIndices: readonly number[],
  constraints: readonly GridGeometryResizeConstraint[],
  trackType: GridGeometryTrackType,
): GridGeometryResult<number> => {
  if (trackIndices.some((index) => !hasNumericValue(tracks[index]))) {
    return measurementRequired(trackType);
  }
  const requestedReduction = trackIndices.reduce(
    (total, index) => total + numericValue(tracks[index]),
    0,
  );
  return ok(
    getConstrainedGroupReductions(
      tracks,
      trackIndices,
      constraints,
      requestedReduction,
    ).reduce((total, reduction) => total + reduction, 0),
  );
};

/**
 * Move a boundary between two groups of tracks, distributing the change across
 * each group in proportion to current track sizes and honouring the minimum
 * size constraints declared for each group.
 */
export const resizeTracksProportionally = (
  tracks: readonly GridGeometryTrack[],
  {
    afterConstraints = [],
    afterTrackIndices,
    beforeConstraints = [],
    beforeTrackIndices,
    delta,
    initialSizes,
  }: GridProportionalResize,
  trackType: GridGeometryTrackType,
): GridGeometryResult<GridTrackTransition> => {
  const resizedIndices = [...beforeTrackIndices, ...afterTrackIndices];
  if (resizedIndices.some((index) => tracks[index] === undefined)) {
    return failure(
      "TRACK_NOT_FOUND",
      "[GridTracks] proportional resize track not found",
      trackType,
    );
  }
  const next = [...tracks];
  if (initialSizes) {
    resizedIndices.forEach((trackIndex) => {
      next[trackIndex] = sizedTrack(pixelSize(initialSizes[trackIndex]));
    });
  }
  if (resizedIndices.some((index) => !hasNumericValue(next[index]))) {
    return measurementRequired(trackType);
  }

  const resizeGroup = (
    indices: readonly number[],
    constraints: readonly GridGeometryResizeConstraint[],
    totalChange: number,
  ): GridGeometryError | undefined => {
    const groupTracks = indices.map((index) => next[index]);
    if (totalChange >= 0) {
      const groupSize = groupTracks.reduce(
        (total, track) => total + numericValue(track),
        0,
      );
      let appliedChange = 0;
      for (const [index, trackIndex] of indices.entries()) {
        const change =
          index === indices.length - 1
            ? totalChange - appliedChange
            : groupSize === 0
              ? totalChange / indices.length
              : totalChange * (numericValue(next[trackIndex]) / groupSize);
        const incremented = incrementTrack(next[trackIndex], change, trackType);
        if (!incremented.ok) {
          return incremented.error;
        }
        next[trackIndex] = incremented.value;
        appliedChange += change;
      }
      return;
    }

    const reductions = getConstrainedGroupReductions(
      next,
      indices,
      constraints,
      -totalChange,
    );
    for (const [index, trackIndex] of indices.entries()) {
      const incremented = incrementTrack(
        next[trackIndex],
        -reductions[index],
        trackType,
      );
      if (!incremented.ok) {
        return incremented.error;
      }
      next[trackIndex] = incremented.value;
    }
  };

  const beforeError = resizeGroup(
    beforeTrackIndices,
    beforeConstraints,
    -delta,
  );
  if (beforeError) {
    return { error: beforeError, ok: false };
  }
  const afterError = resizeGroup(afterTrackIndices, afterConstraints, delta);
  if (afterError) {
    return { error: afterError, ok: false };
  }
  return ok(transition(next, identitySources(tracks.length)));
};

// ---------------------------------------------------------------------------
// item helpers
// ---------------------------------------------------------------------------

const span = (start: number, end: number): GridGeometrySpan => ({ end, start });

const cloneItem = (
  item: GridGeometryItem,
  { column, row }: { column?: GridGeometrySpan; row?: GridGeometrySpan },
): GridGeometryItem => ({
  ...item,
  column: column ? span(column.start, column.end) : item.column,
  row: row ? span(row.start, row.end) : item.row,
});

export const findGeometryItem = (
  geometry: GridGeometry,
  itemId: GridItemId,
): GridGeometryItem | undefined =>
  geometry.items.find(({ id }) => id === itemId);

const requireItem = (
  geometry: GridGeometry,
  itemId: GridItemId,
): GridGeometryResult<GridGeometryItem> => {
  const item = findGeometryItem(geometry, itemId);
  return item
    ? ok(item)
    : failure<GridGeometryItem>(
        "ITEM_NOT_FOUND",
        `[GridModel] GridItem #${itemId} not found`,
      );
};

/**
 * Apply position updates to a geometry, returning a new geometry. Updates
 * applied to a stacked-content item are propagated to its stacked members,
 * matching the way the legacy model applies child positions.
 */
export const applyGeometryUpdates = (
  geometry: GridGeometry,
  updates: readonly GridGeometryUpdate[],
): GridGeometry => {
  if (updates.length === 0) {
    return geometry;
  }
  const updatesById = new Map<string, GridGeometryUpdate>();
  const addUpdate = (update: GridGeometryUpdate) => {
    const existing = updatesById.get(update.id);
    updatesById.set(update.id, existing ? { ...existing, ...update } : update);
  };
  for (const update of updates) {
    addUpdate(update);
    const item = findGeometryItem(geometry, update.id);
    if (item?.type === "stacked-content") {
      for (const { id } of stackedChildItems(geometry, update.id)) {
        addUpdate({ ...update, id });
      }
    }
  }
  return {
    ...geometry,
    items: geometry.items.map((item) => {
      const update = updatesById.get(item.id);
      return update ? cloneItem(item, update) : item;
    }),
  };
};

/**
 * Apply only one axis of a set of updates. The legacy model applies contra
 * updates axis by axis, which means a row update reported in the column update
 * list is broadcast but never applied.
 */
const applyGeometryAxisUpdates = (
  geometry: GridGeometry,
  updates: readonly GridGeometryUpdate[],
  axis: GridGeometryTrackType,
): GridGeometry =>
  applyGeometryUpdates(
    geometry,
    updates.flatMap((update) =>
      update[axis] ? [{ [axis]: update[axis], id: update.id }] : [],
    ),
  );

const withTracks = (
  geometry: GridGeometry,
  trackType: GridGeometryTrackType,
  tracks: readonly GridGeometryTrack[],
): GridGeometry =>
  trackType === "column"
    ? { ...geometry, columns: trackSizes(tracks) }
    : { ...geometry, rows: trackSizes(tracks) };

export const isFixedHeightItem = ({ resizeable }: GridGeometryItem) =>
  resizeable === false || resizeable === undefined || resizeable === "h";

export const isFixedWidthItem = ({ resizeable }: GridGeometryItem) =>
  resizeable === false || resizeable === undefined || resizeable === "v";

export const canSplitGridItem = (
  item: GridGeometryItem,
  splitDirection: GridGeometrySplitDirection,
) =>
  splitDirection === "east" || splitDirection === "west"
    ? !isFixedWidthItem(item)
    : !isFixedHeightItem(item);

export const gridResizeDirectionForSplit = (
  splitDirection: GridGeometrySplitDirection,
): GridGeometryResizeDirection =>
  splitDirection === "north" || splitDirection === "south"
    ? "vertical"
    : "horizontal";

const byColumnStart = (item1: GridGeometryItem, item2: GridGeometryItem) =>
  item1.column.start - item2.column.start;

const byRowStart = (item1: GridGeometryItem, item2: GridGeometryItem) =>
  item1.row.start - item2.row.start;

const positionComparator = (p1: GridGeometrySpan, p2: GridGeometrySpan) => {
  if (p1.start < p2.start) {
    return -1;
  } else if (p1.start > p2.start) {
    return 1;
  } else if (p1.end < p2.end) {
    return -1;
  } else if (p1.end > p2.end) {
    return 1;
  }
  return 0;
};

const byColumnPosition = (
  { column: pos1 }: GridGeometryItem,
  { column: pos2 }: GridGeometryItem,
) => positionComparator(pos1, pos2);

const byRowPosition = (
  { row: pos1 }: GridGeometryItem,
  { row: pos2 }: GridGeometryItem,
) => positionComparator(pos1, pos2);

export const itemsFillColumn = (
  items: readonly GridGeometryItem[],
  pos: GridGeometrySpan,
) => {
  const sortedItems = [...items].sort(byColumnPosition);
  const firstItem = sortedItems.at(0);
  const lastItem = sortedItems.at(-1);
  if (firstItem && lastItem) {
    const { start } = firstItem.column;
    const { end } = lastItem.column;
    if (start === pos.start && end === pos.end) {
      for (let i = 1; i < sortedItems.length; i++) {
        if (sortedItems[i - 1].column.end !== sortedItems[i].column.start) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};

export const itemsFillRow = (
  items: readonly GridGeometryItem[],
  pos: GridGeometrySpan,
) => {
  const sortedItems = [...items].sort(byRowPosition);
  const firstItem = sortedItems.at(0);
  const lastItem = sortedItems.at(-1);
  if (firstItem && lastItem) {
    const { start } = firstItem.row;
    const { end } = lastItem.row;
    if (start === pos.start && end === pos.end) {
      for (let i = 1; i < sortedItems.length; i++) {
        if (sortedItems[i - 1].row.end !== sortedItems[i].row.start) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};

const findByColumnStart = (items: readonly GridGeometryItem[], col: number) => {
  const matches = items.filter(({ column: { start } }) => start === col);
  return matches.length === 0 ? undefined : matches;
};

const findByColumnEnd = (items: readonly GridGeometryItem[], col: number) => {
  const matches = items.filter(({ column: { end } }) => end === col);
  return matches.length === 0 ? undefined : matches;
};

const findByRowStart = (items: readonly GridGeometryItem[], row: number) => {
  const matches = items.filter(({ row: { start } }) => start === row);
  return matches.length === 0 ? undefined : matches;
};

const findByRowEnd = (items: readonly GridGeometryItem[], row: number) => {
  const matches = items.filter(({ row: { end } }) => end === row);
  return matches.length === 0 ? undefined : matches;
};

const stackedChildItems = (
  geometry: GridGeometry,
  stackId: string,
): readonly GridGeometryItem[] =>
  geometry.items.filter((item) => item.stackId === stackId);

/**
 * Split a grid area in two along a grid line, returning the position of the
 * dropped item followed by the position of the split target.
 */
export const splitGridChildPosition = (
  { column, row }: { column: GridGeometrySpan; row: GridGeometrySpan },
  splitDirection: GridGeometrySplitDirection,
  splitTrackIndex: number,
): [
  { column: GridGeometrySpan; row: GridGeometrySpan },
  { column: GridGeometrySpan; row: GridGeometrySpan },
] => {
  const { start: colStart, end: colEnd } = column;
  const { start: rowStart, end: rowEnd } = row;
  switch (splitDirection) {
    case "north":
      return [
        {
          column: span(colStart, colEnd),
          row: span(rowStart, splitTrackIndex),
        },
        { column: span(colStart, colEnd), row: span(splitTrackIndex, rowEnd) },
      ];
    case "east":
      return [
        { column: span(splitTrackIndex, colEnd), row: span(rowStart, rowEnd) },
        {
          column: span(colStart, splitTrackIndex),
          row: span(rowStart, rowEnd),
        },
      ];
    case "south":
      return [
        { column: span(colStart, colEnd), row: span(splitTrackIndex, rowEnd) },
        {
          column: span(colStart, colEnd),
          row: span(rowStart, splitTrackIndex),
        },
      ];
    case "west":
      return [
        {
          column: span(colStart, splitTrackIndex),
          row: span(rowStart, rowEnd),
        },
        { column: span(splitTrackIndex, colEnd), row: span(rowStart, rowEnd) },
      ];
  }
};

// ---------------------------------------------------------------------------
// item transitions
// ---------------------------------------------------------------------------

export interface GridGeometryTransition {
  readonly columns?: GridTrackTransition;
  readonly rows?: GridTrackTransition;
  /** updates applied to the model without notifying position listeners */
  readonly silentUpdates: readonly GridGeometryUpdate[];
  /** the geometry that results from applying this transition */
  readonly geometry: GridGeometry;
  /** updates applied to the model and broadcast to position listeners */
  readonly updates: readonly GridGeometryUpdate[];
}

const trackTransitionFor = (
  trackType: GridGeometryTrackType,
  trackTransition: GridTrackTransition | undefined,
) =>
  trackTransition === undefined
    ? {}
    : trackType === "column"
      ? { columns: trackTransition }
      : { rows: trackTransition };

/**
 * Shift items to accommodate a track that has been inserted at `trackIndex`.
 */
export const shiftItemsForNewTrack = (
  items: readonly GridGeometryItem[],
  trackType: GridGeometryTrackType,
  trackIndex: number,
): GridGeometryUpdate[] => {
  const gridPosition = trackIndex + 1;
  const updates: GridGeometryUpdate[] = [];
  for (const item of items) {
    const { start, end } = item[trackType];
    if (start > gridPosition) {
      updates.push({ [trackType]: span(start + 1, end + 1), id: item.id });
    } else if (end > gridPosition) {
      updates.push({ [trackType]: span(start, end + 1), id: item.id });
    }
  }
  return updates;
};

const splitTargetUpdates = (
  geometry: GridGeometry,
  droppedItemId: GridItemId,
  targetItemId: GridItemId,
  splitDirection: GridGeometrySplitDirection,
  splitIndex: number,
  order: "target-first" | "dropped-first",
): GridGeometryUpdate[] => {
  const targetItem = findGeometryItem(geometry, targetItemId);
  if (targetItem === undefined) {
    return [];
  }
  const [droppedItemPosition, targetItemPosition] = splitGridChildPosition(
    targetItem,
    splitDirection,
    splitIndex,
  );
  const droppedUpdate = { ...droppedItemPosition, id: droppedItemId };
  const targetUpdate = { ...targetItemPosition, id: targetItemId };
  const updates =
    order === "target-first"
      ? [targetUpdate, droppedUpdate]
      : [droppedUpdate, targetUpdate];

  if (targetItem.type === "stacked-content") {
    updates.push(
      ...stackedChildItems(geometry, targetItemId).map(({ id }) => ({
        ...targetItemPosition,
        id,
      })),
    );
  }
  return updates;
};

export interface GridSplitItemRequest {
  readonly droppedItemId: GridItemId;
  readonly resizeDirection?: GridGeometryResizeDirection;
  readonly splitDirection: GridGeometrySplitDirection;
  readonly targetItemId: GridItemId;
}

/**
 * A dragged item has been dropped on a (NESW) quadrant of a target item.
 * Split the target, adding or reusing a grid line as required.
 */
export const splitGridItem = (
  geometry: GridGeometry,
  {
    droppedItemId,
    resizeDirection,
    splitDirection,
    targetItemId,
  }: GridSplitItemRequest,
  measurements: GridMeasurements = NO_MEASUREMENTS,
): GridGeometryResult<GridGeometryTransition> => {
  const target = requireItem(geometry, targetItemId);
  if (!target.ok) {
    return target;
  }
  const droppedItem = requireItem(geometry, droppedItemId);
  if (!droppedItem.ok) {
    return droppedItem;
  }
  const targetGridItem = target.value;
  if (!canSplitGridItem(targetGridItem, splitDirection)) {
    return failure(
      "NON_RESIZABLE",
      `Grid item #${targetItemId} cannot be split ${splitDirection}`,
    );
  }

  const trackType =
    (resizeDirection ?? gridResizeDirectionForSplit(splitDirection)) ===
    "vertical"
      ? "row"
      : "column";
  const tracks = readTracks(
    geometryTracks(geometry, trackType),
    measurements[trackType],
  );
  const resizeTrack = targetGridItem[trackType];

  const splitAtNewTrack = (
    trackTransition: GridTrackTransition,
    newTrackIndex: number,
    splitIndexFor: (item: GridGeometryItem) => number,
  ): GridGeometryResult<GridGeometryTransition> => {
    const silentUpdates = shiftItemsForNewTrack(
      geometry.items,
      trackType,
      newTrackIndex,
    );
    const accommodated = withTracks(
      applyGeometryUpdates(geometry, silentUpdates),
      trackType,
      trackTransition.tracks,
    );
    const updatedTarget = findGeometryItem(accommodated, targetItemId);
    if (updatedTarget === undefined) {
      return failure(
        "ITEM_NOT_FOUND",
        `[GridModel] GridItem #${targetItemId} not found`,
      );
    }
    const updates = splitTargetUpdates(
      accommodated,
      droppedItemId,
      targetItemId,
      splitDirection,
      splitIndexFor(updatedTarget),
      "target-first",
    );
    return ok({
      ...trackTransitionFor(trackType, trackTransition),
      geometry: applyGeometryUpdates(accommodated, updates),
      silentUpdates,
      updates,
    });
  };

  if (resizeTrack.end - resizeTrack.start === 1) {
    const newTrackIndex = resizeTrack.start - 1;
    const trackTransition = splitTrack(tracks, newTrackIndex, trackType);
    if (!trackTransition.ok) {
      return trackTransition;
    }
    return splitAtNewTrack(trackTransition.value, newTrackIndex, (item) =>
      trackType === "row" ? item.row.end - 1 : item.column.end - 1,
    );
  }

  const bisectingGridTrack = findBisectingTrack(
    tracks,
    resizeTrack.start,
    resizeTrack.end,
    trackType,
  );
  if (!bisectingGridTrack.ok) {
    return bisectingGridTrack;
  }

  if (bisectingGridTrack.value !== -1) {
    const updates = splitTargetUpdates(
      geometry,
      droppedItemId,
      targetItemId,
      splitDirection,
      bisectingGridTrack.value,
      "dropped-first",
    );
    return ok({
      geometry: applyGeometryUpdates(geometry, updates),
      silentUpdates: [],
      updates,
    });
  }

  const bisection = bisectTracks(
    tracks,
    resizeTrack.start,
    resizeTrack.end,
    trackType,
  );
  if (!bisection.ok) {
    return bisection;
  }
  return splitAtNewTrack(
    bisection.value.transition,
    bisection.value.newTrackIndex,
    () => bisection.value.newTrackIndex + 2,
  );
};

export interface GridReplaceItemRequest {
  readonly droppedItemId: GridItemId;
  readonly targetItemId: GridItemId;
}

export interface GridReplaceItemTransition extends GridGeometryTransition {
  readonly removals: readonly GridGeometryRemoval[];
}

/**
 * A dragged item has been dropped on the centre of a target item; the dropped
 * item takes over the target's grid area and the target is removed.
 */
export const replaceGridItem = (
  geometry: GridGeometry,
  { droppedItemId, targetItemId }: GridReplaceItemRequest,
): GridGeometryResult<GridReplaceItemTransition> => {
  const dropped = requireItem(geometry, droppedItemId);
  if (!dropped.ok) {
    return dropped;
  }
  const target = requireItem(geometry, targetItemId);
  if (!target.ok) {
    return target;
  }
  const { column, row } = target.value;
  const removals: GridGeometryRemoval[] = [
    { id: targetItemId, reason: "close" },
  ];
  const silentUpdates: GridGeometryUpdate[] = [
    { column, id: droppedItemId, row },
  ];
  if (dropped.value.type === "stacked-content") {
    silentUpdates.push(
      ...stackedChildItems(geometry, droppedItemId).map(({ id }) => ({
        column,
        id,
        row,
      })),
    );
  }
  const next = applyGeometryUpdates(
    {
      ...geometry,
      items: geometry.items.filter(({ id }) => id !== targetItemId),
    },
    silentUpdates,
  );
  return ok({
    geometry: next,
    removals,
    silentUpdates,
    updates: [],
  });
};

/**
 * Identify grid lines that no longer serve as the start of one item and the
 * end of another, and which can therefore be removed.
 */
export const findUnusedGridLines = (geometry: GridGeometry) => {
  const colCount = geometry.columns.length;
  const rowCount = geometry.rows.length;
  const unusedStartPositions: number[] = [];
  const unusedColLines: number[] = [];
  const unusedRowLines: number[] = [];

  const items = geometry.items.filter((item) => !item.dragging);

  for (let i = 1; i <= colCount; i++) {
    if (!findByColumnStart(items, i)) {
      unusedStartPositions.push(i);
    }
  }
  for (let i = 2; i <= colCount + 1; i++) {
    if (!findByColumnEnd(items, i) && unusedStartPositions.includes(i)) {
      unusedColLines.push(i);
    }
  }

  unusedStartPositions.length = 0;

  for (let i = 1; i <= rowCount; i++) {
    if (!findByRowStart(items, i)) {
      unusedStartPositions.push(i);
    }
  }
  for (let i = 2; i <= rowCount + 1; i++) {
    if (!findByRowEnd(items, i) && unusedStartPositions.includes(i)) {
      unusedRowLines.push(i);
    }
  }

  return [unusedColLines, unusedRowLines] as const;
};

/**
 * Shift items to accommodate a track inserted at `index`. The insert position
 * describes which of the two neighbouring tracks the new track overlaps.
 */
export const shiftItemsForInsertedTrack = (
  items: readonly GridGeometryItem[],
  trackType: GridGeometryTrackType,
  index: number,
  position: GridGeometryTrackInsertPosition,
): GridGeometryUpdate[] => {
  const gridPosition = index + 1;
  const updates: GridGeometryUpdate[] = [];
  for (const item of items) {
    const { start, end } = item[trackType];
    if (position === "before") {
      if (start >= gridPosition) {
        updates.push({ [trackType]: span(start + 1, end + 1), id: item.id });
      } else if (end >= gridPosition) {
        updates.push({ [trackType]: span(start, end + 1), id: item.id });
      }
    } else if (start > gridPosition) {
      updates.push({ [trackType]: span(start + 1, end + 1), id: item.id });
    } else if (end > gridPosition) {
      updates.push({ [trackType]: span(start, end + 1), id: item.id });
    }
  }
  return updates;
};

/**
 * When a grid line is removed, every item bound to a line beyond it must be
 * rebound one line lower.
 */
export const shiftItemsForRemovedTrack = (
  items: readonly GridGeometryItem[],
  trackType: GridGeometryTrackType,
  trackIndex: number,
): GridGeometryUpdate[] => {
  const gridPosition = trackIndex + 1;
  const updates: GridGeometryUpdate[] = [];
  for (const item of items) {
    const { start, end } = item[trackType];
    const nextStart = start > gridPosition ? start - 1 : start;
    const nextEnd = end > gridPosition ? end - 1 : end;
    if (nextStart !== start || nextEnd !== end) {
      updates.push({ [trackType]: span(nextStart, nextEnd), id: item.id });
    }
  }
  return updates;
};

const mergeUpdates = (
  target: GridGeometryUpdate[],
  additions: readonly GridGeometryUpdate[],
) => {
  for (const update of additions) {
    const index = target.findIndex(({ id }) => id === update.id);
    if (index === -1) {
      target.push(update);
    } else {
      target[index] = { ...target[index], ...update };
    }
  }
};

/**
 * Identify the neighbouring item(s) that can be extended to occupy the space
 * left behind by a removed item.
 */
const updateContrasToOccupySpace = (
  geometry: GridGeometry,
  { column, id, row }: GridGeometryItem,
): [GridGeometryUpdate[], GridGeometryUpdate[]] => {
  const { items } = geometry;
  const adjacentItemsWithSameRowStart = findByRowStart(
    items,
    row.start,
  )?.filter(
    ({ column: { start, end }, stackId }) =>
      stackId === undefined && (end === column.start || start === column.end),
  );
  if (adjacentItemsWithSameRowStart) {
    // TODO sort by column, so we get the left item first
    const itemsInSameRow = adjacentItemsWithSameRowStart.filter(
      (item) => item.row.end === row.end && item.id !== id,
    );
    if (itemsInSameRow.length === 1) {
      const [itemInSameRow] = itemsInSameRow;
      const {
        id: contraId,
        column: { start, end },
      } = itemInSameRow;
      if (end === column.start || start === column.end) {
        const nextColumn =
          end === column.start
            ? span(start, column.end)
            : span(column.start, end);
        const updates: GridGeometryUpdate[] = [
          { column: nextColumn, id: contraId },
        ];
        if (itemInSameRow.type === "stacked-content") {
          updates.push(
            ...stackedChildItems(geometry, itemInSameRow.id).map(
              ({ id: stackedId }) => ({ column: nextColumn, id: stackedId }),
            ),
          );
        }
        return [updates, []];
      }
    } else if (itemsInSameRow.length === 2) {
      // assuming no overlapping gridcells, the most we can have here
      // is 2 items in same row, one left and one right
      const adjacentBefore = itemsInSameRow.filter(
        (item) => item.column.end === column.start,
      );
      if (adjacentBefore.length === 1) {
        const {
          id: contraId,
          column: { start },
        } = adjacentBefore[0];
        return [[{ column: span(start, column.end), id: contraId }], []];
      }
      const adjacentAfter = itemsInSameRow.filter(
        (item) => item.column.start === column.end,
      );
      if (adjacentAfter.length === 1) {
        const {
          id: contraId,
          column: { end },
        } = adjacentAfter[0];
        return [[{ column: span(column.start, end), id: contraId }], []];
      }
    } else if (row.end - row.start > 1) {
      // We do not have a single gridcell that can be extended to cover our
      // gridcell of interest, but we might have multiple cells that together
      // can serve the same end.
      const itemsEndingWhereTargetStarts = findByColumnEnd(
        items,
        column.start,
      )?.filter(
        (item) =>
          item.stackId === undefined &&
          item.row.start >= row.start &&
          item.row.end <= row.end,
      );
      if (
        itemsEndingWhereTargetStarts &&
        itemsFillRow(itemsEndingWhereTargetStarts, row)
      ) {
        return [
          itemsEndingWhereTargetStarts.map(
            ({ id: contraId, column: { start } }) => ({
              column: span(start, column.end),
              id: contraId,
            }),
          ),
          [],
        ];
      }
      const itemsStartingWhereTargetEnds = findByColumnStart(
        items,
        column.end,
      )?.filter(
        (item) =>
          item.stackId === undefined &&
          item.row.start >= row.start &&
          item.row.end <= row.end,
      );
      if (
        itemsStartingWhereTargetEnds &&
        itemsFillRow(itemsStartingWhereTargetEnds, row)
      ) {
        return [
          itemsStartingWhereTargetEnds.map(
            ({ id: contraId, column: { end } }) => ({
              column: span(column.start, end),
              id: contraId,
            }),
          ),
          [],
        ];
      }
    }
  }

  const adjacentItemsWithSameColumnStart = findByColumnStart(
    items,
    column.start,
  )?.filter(
    ({ row: { start, end }, stackId }) =>
      stackId === undefined && (end === row.start || start === row.end),
  );
  if (adjacentItemsWithSameColumnStart) {
    const itemsInSameColumn = adjacentItemsWithSameColumnStart.filter(
      (item) => item.column.end === column.end && item.id !== id,
    );
    if (itemsInSameColumn.length === 1) {
      const [itemInSameColumn] = itemsInSameColumn;
      const {
        id: contraId,
        row: { start, end },
      } = itemInSameColumn;
      if (end === row.start || start === row.end) {
        const nextRow =
          end === row.start ? span(start, row.end) : span(row.start, end);
        const updates: GridGeometryUpdate[] = [{ id: contraId, row: nextRow }];
        if (itemInSameColumn.type === "stacked-content") {
          updates.push(
            ...stackedChildItems(geometry, itemInSameColumn.id).map(
              ({ id: stackedId }) => ({ id: stackedId, row: nextRow }),
            ),
          );
        }
        return [[], updates];
      }
    } else if (itemsInSameColumn.length === 2) {
      const adjacentBefore = itemsInSameColumn.filter(
        (item) => item.row.end === row.start,
      );
      if (adjacentBefore.length === 1) {
        const {
          id: contraId,
          row: { start },
        } = adjacentBefore[0];
        // NOTE preserved legacy behaviour: these row updates are reported in
        // the column update list
        return [[{ id: contraId, row: span(start, row.end) }], []];
      }
      const adjacentAfter = itemsInSameColumn.filter(
        (item) => item.row.start === row.end,
      );
      if (adjacentAfter.length === 1) {
        const {
          id: contraId,
          row: { end },
        } = adjacentAfter[0];
        return [[{ id: contraId, row: span(row.start, end) }], []];
      }
    } else if (column.end - column.start > 1) {
      const itemsEndingWhereTargetStarts = findByRowEnd(
        items,
        row.start,
      )?.filter(
        (item) =>
          item.column.start >= column.start && item.column.end <= column.end,
      );
      if (
        itemsEndingWhereTargetStarts &&
        itemsFillColumn(itemsEndingWhereTargetStarts, column)
      ) {
        return [
          [],
          itemsEndingWhereTargetStarts.map(
            ({ id: contraId, row: { start } }) => ({
              id: contraId,
              row: span(start, row.end),
            }),
          ),
        ];
      }
      const itemsStartingWhereTargetEnds = findByRowStart(
        items,
        row.end,
      )?.filter(
        (item) =>
          item.column.start >= column.start && item.column.end <= column.end,
      );
      if (
        itemsStartingWhereTargetEnds &&
        itemsFillColumn(itemsStartingWhereTargetEnds, column)
      ) {
        return [
          [],
          itemsStartingWhereTargetEnds.map(
            ({ id: contraId, row: { end } }) => ({
              id: contraId,
              row: span(row.start, end),
            }),
          ),
        ];
      }
    }
  }
  return [[], []];
};

export interface GridRemoveItemRequest {
  readonly itemId: GridItemId;
  readonly reason: GridGeometryRemoveReason;
}

export interface GridRemoveItemTransition extends GridGeometryTransition {
  /** true when listeners are notified of the position updates */
  readonly notify: boolean;
  readonly placeholders?: {
    readonly added: readonly GridGeometryItem[];
    readonly removedIds: readonly GridItemId[];
  };
  readonly removals: readonly GridGeometryRemoval[];
  /** true when the removed item was a member of a stack */
  readonly stackMember: boolean;
}

/**
 * Remove an item, extending contra items to occupy the space it leaves,
 * normalizing tracks that are no longer referenced and regenerating
 * placeholders for any space that remains empty.
 */
export const removeGridItem = (
  geometry: GridGeometry,
  { itemId, reason }: GridRemoveItemRequest,
  {
    createPlaceholderId,
    measurements = NO_MEASUREMENTS,
  }: {
    createPlaceholderId: () => string;
    measurements?: GridMeasurements;
  },
): GridGeometryResult<GridRemoveItemTransition> => {
  const target = requireItem(geometry, itemId);
  if (!target.ok) {
    return target;
  }
  const gridItem = target.value;

  const removals: GridGeometryRemoval[] = [{ id: itemId, reason }];
  let current: GridGeometry =
    reason === "drag"
      ? {
          ...geometry,
          items: geometry.items.map((item) =>
            item.id === itemId ? { ...item, dragging: true } : item,
          ),
        }
      : {
          ...geometry,
          items: geometry.items.filter(({ id }) => id !== itemId),
        };

  if (gridItem.stackId) {
    return ok({
      geometry: current,
      notify: false,
      removals,
      silentUpdates: [],
      stackMember: true,
      updates: [],
    });
  }

  const [colItemUpdates, rowItemUpdates] = updateContrasToOccupySpace(
    current,
    gridItem,
  );
  current = applyGeometryAxisUpdates(current, colItemUpdates, "column");
  current = applyGeometryAxisUpdates(current, rowItemUpdates, "row");

  const [unusedColLines, unusedRowLines] = findUnusedGridLines(current);

  let columnTracks = readTracks(current.columns, measurements.column);
  let rowTracks = readTracks(current.rows, measurements.row);
  let columns: GridTrackTransition | undefined;
  let rows: GridTrackTransition | undefined;

  for (const line of [...unusedColLines].sort((a, b) => b - a)) {
    const shifts = shiftItemsForRemovedTrack(current.items, "column", line - 1);
    mergeUpdates(colItemUpdates, shifts);
    current = applyGeometryUpdates(current, shifts);
    const removed = removeTrack(columnTracks, line - 1, "bwd", "column");
    if (!removed.ok) {
      return removed;
    }
    columnTracks = removed.value.tracks;
    columns = composeTransitions(columns, removed.value);
    current = withTracks(current, "column", columnTracks);
  }

  for (const line of [...unusedRowLines].sort((a, b) => b - a)) {
    const shifts = shiftItemsForRemovedTrack(current.items, "row", line - 1);
    mergeUpdates(rowItemUpdates, shifts);
    current = applyGeometryUpdates(current, shifts);
    const removed = removeTrack(rowTracks, line - 1, "bwd", "row");
    if (!removed.ok) {
      return removed;
    }
    rowTracks = removed.value.tracks;
    rows = composeTransitions(rows, removed.value);
    current = withTracks(current, "row", rowTracks);
  }

  const notify =
    colItemUpdates.length > 0 ||
    rowItemUpdates.length > 0 ||
    unusedColLines.length > 0 ||
    unusedRowLines.length > 0;

  const transitionResult: GridRemoveItemTransition = {
    ...(columns ? { columns } : {}),
    ...(rows ? { rows } : {}),
    geometry: current,
    notify,
    removals,
    silentUpdates: [],
    stackMember: false,
    updates: [...colItemUpdates, ...rowItemUpdates],
  };

  if (reason === "placeholder") {
    return ok(transitionResult);
  }

  const placeholders = regeneratePlaceholders(current, createPlaceholderId);
  return ok({
    ...transitionResult,
    geometry: placeholders.geometry,
    placeholders: {
      added: placeholders.added,
      removedIds: placeholders.removedIds,
    },
  });
};

export interface GridPlaceholderTransition {
  readonly added: readonly GridGeometryItem[];
  readonly geometry: GridGeometry;
  readonly removedIds: readonly GridItemId[];
}

const rowCellsAllEmpty = (
  fromIndex: number,
  toIndex: number,
  row?: number[],
) => {
  if (!row) {
    return false;
  }
  for (let i = fromIndex; i < toIndex; i++) {
    if (row[i] !== 0) {
      return false;
    }
  }
  return true;
};

/**
 * Build the occupancy matrix for a set of items.
 */
export const getGridMatrix = (
  items: readonly GridGeometryItem[],
  rowCount: number,
  colCount: number,
): number[][] => {
  const grid = Array.from({ length: rowCount }, () =>
    new Array<number>(colCount).fill(0),
  );
  for (const {
    column: { start: colStart, end: colEnd },
    row: { start: rowStart, end: rowEnd },
  } of items) {
    for (let row = rowStart - 1; row < rowEnd - 1; row++) {
      for (let col = colStart - 1; col < colEnd - 1; col++) {
        if (grid[row]?.[col] !== undefined) {
          grid[row][col] += 1;
        }
      }
    }
  }
  return grid;
};

/**
 * Placeholders represent every empty area of the grid. They are regenerated
 * from scratch, so existing placeholders are always replaced.
 */
export const regeneratePlaceholders = (
  geometry: GridGeometry,
  createPlaceholderId: () => string,
): GridPlaceholderTransition => {
  const removedIds = geometry.items
    .filter(({ type }) => type === "placeholder")
    .map(({ id }) => id);
  const items = geometry.items.filter(({ type }) => type !== "placeholder");
  const grid = getGridMatrix(
    items.filter(({ dragging }) => !dragging),
    geometry.rows.length,
    geometry.columns.length,
  );
  const added: GridGeometryItem[] = [];

  for (let i = 0; i < grid.length; i++) {
    const cols = grid[i];
    for (let j = 0; j < cols.length; j++) {
      if (cols[j] === 0) {
        cols[j] = 1;
        let nextRow = i + 1;
        let nextCol = j + 1;
        // span as many columns as we find empty cells horizontally
        while (cols[nextCol] === 0) {
          cols[nextCol] = 1;
          nextCol += 1;
        }
        // span multiple rows as well as columns, but only if we can span the
        // same number of columns found above.
        while (rowCellsAllEmpty(j, nextCol, grid[nextRow])) {
          for (let col = j; col < nextCol; col++) {
            grid[nextRow][col] = 1;
          }
          nextRow += 1;
        }
        added.push({
          column: span(j + 1, nextCol + 1),
          id: createPlaceholderId(),
          resizeable: "hv",
          row: span(i + 1, nextRow + 1),
          type: "placeholder",
        });
      }
    }
  }

  return {
    added,
    geometry: { ...geometry, items: [...items, ...added] },
    removedIds,
  };
};

// ---------------------------------------------------------------------------
// splitters
// ---------------------------------------------------------------------------

export interface GridGeometrySplitter {
  readonly align: "start" | "end";
  readonly ariaOrientation: "horizontal" | "vertical";
  readonly column: GridGeometrySpan;
  readonly controls: string;
  readonly id: string;
  readonly orientation: GridGeometryResizeDirection;
  readonly resizedChildItems: {
    readonly after: string[];
    readonly before: string[];
  };
  readonly resizedGridTracks: [number, number];
  readonly row: GridGeometrySpan;
}

export interface GridSplitterGeometry {
  readonly horizontalSplitterItemIds: readonly GridItemId[];
  readonly splitters: readonly GridGeometrySplitter[];
  readonly verticalSplitterItemIds: readonly GridItemId[];
}

interface ContrasAndSiblings {
  readonly contras: GridGeometryItem[];
  readonly position: GridGeometrySpan;
  readonly siblings: GridGeometryItem[];
}

/**
 * Siblings start on the same track edge as the target item, contras end on
 * that same edge. Returns the set of items that a horizontal splitter placed
 * on that edge would resize, together with the span it covers.
 */
const getMatchingColspan = (
  targetGridItem: GridGeometryItem,
  siblings: readonly GridGeometryItem[],
  contras: readonly GridGeometryItem[],
): ContrasAndSiblings | undefined => {
  const startCol = targetGridItem.column.start;
  let siblingIndex = 0;
  let contraIndex = 0;
  const contrasOut: GridGeometryItem[] = [];
  const siblingsOut: GridGeometryItem[] = [targetGridItem];
  const targetAndSiblings = [targetGridItem, ...siblings];

  while (
    siblingIndex < targetAndSiblings.length &&
    contraIndex < contras.length
  ) {
    const sibling = targetAndSiblings[siblingIndex];
    const contra = contras[contraIndex];
    const end = Math.max(contra.column.end, sibling.column.end);

    if (contra.column.end === end && sibling.column.end === end) {
      contrasOut.push(contras[contraIndex]);
      return {
        contras: contrasOut,
        position: span(startCol, end),
        siblings: siblingsOut,
      };
    } else if (contra.column.end < end) {
      contrasOut.push(contras[contraIndex]);
      contraIndex += 1;
    } else {
      siblingsOut.push(siblings[siblingIndex]);
      siblingIndex += 1;
    }
  }
};

const getMatchingRowspan = (
  gridItem: GridGeometryItem,
  siblings: readonly GridGeometryItem[],
  contras: readonly GridGeometryItem[],
): ContrasAndSiblings | undefined => {
  const startRow = gridItem.row.start;
  let siblingIndex = 0;
  let contraIndex = 0;
  const contrasOut: GridGeometryItem[] = [];
  const siblingsOut: GridGeometryItem[] = [gridItem];
  const targetAndSiblings = [gridItem, ...siblings];

  while (
    siblingIndex < targetAndSiblings.length &&
    contraIndex < contras.length
  ) {
    const sibling = targetAndSiblings[siblingIndex];
    const contra = contras[contraIndex];
    const end = Math.max(contra.row.end, sibling.row.end);

    if (contra.row.end === end && sibling.row.end === end) {
      contrasOut.push(contras[contraIndex]);
      return {
        contras: contrasOut,
        position: span(startRow, end),
        siblings: siblingsOut,
      };
    } else if (contra.row.end < end) {
      contrasOut.push(contras[contraIndex]);
      contraIndex += 1;
    } else {
      siblingsOut.push(siblings[siblingIndex]);
      siblingIndex += 1;
    }
  }
};

const getContrasAbove = (
  items: readonly GridGeometryItem[],
  { column, row }: GridGeometryItem,
) => {
  const allContrasAbove = findByRowEnd(items, row.start);
  if (allContrasAbove) {
    const indexOfAlignedContra = allContrasAbove.findIndex(
      (item) => item.column.start === column.start,
    );
    if (indexOfAlignedContra !== -1) {
      return [...allContrasAbove]
        .sort(byColumnStart)
        .slice(indexOfAlignedContra);
    }
  }
  return [];
};

const getContrasBelow = (
  items: readonly GridGeometryItem[],
  { column, row }: GridGeometryItem,
) => {
  const allContrasBelow = findByRowStart(items, row.end);
  if (allContrasBelow) {
    const indexOfAlignedContra = allContrasBelow.findIndex(
      (item) => item.column.start === column.start,
    );
    if (indexOfAlignedContra !== -1) {
      return [...allContrasBelow]
        .sort(byColumnStart)
        .slice(indexOfAlignedContra);
    }
  }
  return [];
};

const getSiblingsRight = (
  items: readonly GridGeometryItem[],
  { column, row }: GridGeometryItem,
) =>
  findByRowStart(items, row.start)?.filter(
    (item) => item.column.start > column.start,
  ) ?? [];

const getContrasLeft = (
  items: readonly GridGeometryItem[],
  { column, row }: GridGeometryItem,
) => {
  const allContrasLeft = findByColumnEnd(items, column.start);
  if (allContrasLeft) {
    const indexOfAlignedContra = allContrasLeft.findIndex(
      (item) => item.row.start === row.start,
    );
    if (indexOfAlignedContra !== -1) {
      return [...allContrasLeft].sort(byRowStart).slice(indexOfAlignedContra);
    }
  }
  return [];
};

const getSiblingsBelow = (
  items: readonly GridGeometryItem[],
  { column, row }: GridGeometryItem,
) =>
  findByColumnStart(items, column.start)?.filter(
    (item) => item.row.start > row.start,
  ) ?? [];

const findColumnContrasAndSiblings = (
  items: readonly GridGeometryItem[],
  childItem: GridGeometryItem,
) => {
  const contrasLeft = getContrasLeft(items, childItem);
  if (contrasLeft.length > 0) {
    return getMatchingRowspan(
      childItem,
      getSiblingsBelow(items, childItem),
      contrasLeft,
    );
  }
};

const findRowContrasAndSiblings = (
  items: readonly GridGeometryItem[],
  childItem: GridGeometryItem,
) => {
  const contrasAbove = getContrasAbove(items, childItem);
  if (contrasAbove.length > 0) {
    if (isFixedHeightItem(childItem)) {
      const contrasBelow = getContrasBelow(items, childItem);
      if (contrasBelow.length > 0) {
        const [contra] = contrasBelow;
        return getMatchingColspan(
          contra,
          getSiblingsRight(items, contra),
          contrasAbove,
        );
      }
    } else {
      return getMatchingColspan(
        childItem,
        getSiblingsRight(items, childItem),
        contrasAbove,
      );
    }
  }
};

/**
 * Compute the splitters for a grid, together with the items that carry a
 * horizontal or vertical splitter.
 */
export const computeSplitters = (
  geometry: GridGeometry,
): GridSplitterGeometry => {
  const { items } = geometry;
  const layoutItems = items.filter(({ stackId }) => stackId === undefined);
  const splitters: GridGeometrySplitter[] = [];
  const horizontalSplitterItemIds: GridItemId[] = [];
  const verticalSplitterItemIds: GridItemId[] = [];

  for (const childItem of layoutItems) {
    const { column, id, row } = childItem;

    // 1) Horizontal (column) resizing - the vertically aligned splitters
    if (!isFixedWidthItem(childItem)) {
      const columnContrasAndSiblings = findColumnContrasAndSiblings(
        layoutItems,
        childItem,
      );
      if (columnContrasAndSiblings) {
        const resizeTrackIndex = column.start - 1;
        const contraTrackIndex = column.start - 2;
        columnContrasAndSiblings.siblings.forEach((sibling) => {
          verticalSplitterItemIds.push(sibling.id);
        });
        splitters.push({
          align: "start",
          ariaOrientation: "vertical",
          column,
          controls: id,
          id: `${id}-splitter-h`,
          orientation: "horizontal",
          resizedChildItems: {
            after: columnContrasAndSiblings.siblings.map((c) => c.id),
            before: columnContrasAndSiblings.contras.map((c) => c.id),
          },
          resizedGridTracks: [contraTrackIndex, resizeTrackIndex],
          row: columnContrasAndSiblings.position,
        });
      }
    }

    // 2) Vertical (row) resizing - the horizontally aligned splitters
    if (!isFixedHeightItem(childItem)) {
      const rowContrasAndSiblings = findRowContrasAndSiblings(
        layoutItems,
        childItem,
      );
      if (rowContrasAndSiblings) {
        const contraTrackIndex = row.start - 2;
        let resizeTrackIndex = row.start - 1;
        if (rowContrasAndSiblings.siblings[0].id !== childItem.id) {
          resizeTrackIndex = rowContrasAndSiblings.siblings[0].row.start - 1;
        }
        rowContrasAndSiblings.siblings.forEach((sibling) => {
          horizontalSplitterItemIds.push(sibling.id);
        });
        splitters.push({
          align: "start",
          ariaOrientation: "horizontal",
          column: rowContrasAndSiblings.position,
          controls: id,
          id: `${id}-splitter-v`,
          orientation: "vertical",
          resizedChildItems: {
            after: rowContrasAndSiblings.siblings.map((c) => c.id),
            before: rowContrasAndSiblings.contras.map((c) => c.id),
          },
          resizedGridTracks: [contraTrackIndex, resizeTrackIndex],
          row,
        });
      }
    }
  }

  return { horizontalSplitterItemIds, splitters, verticalSplitterItemIds };
};

/**
 * Resize requires a new track if the splitter being used for the resize sits
 * on the same track edge as another splitter.
 */
export const doesResizeRequireNewTrack = (
  splitters: readonly GridGeometrySplitter[],
  splitter: GridGeometrySplitter,
) => {
  const potentialCandidates = splitters.filter(
    ({ id, orientation }) =>
      orientation === splitter.orientation && id !== splitter.id,
  );
  if (potentialCandidates.length > 0) {
    const track = splitter.orientation === "horizontal" ? "column" : "row";
    const splitterStart = splitter[track].start;
    return potentialCandidates.some(
      ({ [track]: { start } }) => start === splitterStart,
    );
  }
  return false;
};

// ---------------------------------------------------------------------------
// track insertion / removal driven by splitter resize
// ---------------------------------------------------------------------------

export interface GridInsertTrackRequest {
  readonly contraItemIds: readonly GridItemId[];
  readonly index: number;
  readonly position: GridGeometryTrackInsertPosition;
  readonly resizeItemIds: readonly GridItemId[];
  readonly size: number;
  readonly trackType: GridGeometryTrackType;
}

export interface GridInsertTrackTransition {
  readonly anchorUpdates: readonly GridGeometryUpdate[];
  readonly columns?: GridTrackTransition;
  readonly geometry: GridGeometry;
  readonly insertUpdates: readonly GridGeometryUpdate[];
  readonly rows?: GridTrackTransition;
}

/**
 * Insert a new grid line so that an item sharing a track edge with other items
 * can be resized independently, and anchor the resized/contra items to it.
 */
export const insertTrackForResize = (
  geometry: GridGeometry,
  {
    contraItemIds,
    index,
    position,
    resizeItemIds,
    size,
    trackType,
  }: GridInsertTrackRequest,
  measurements: GridMeasurements = NO_MEASUREMENTS,
): GridGeometryResult<GridInsertTrackTransition> => {
  const tracks = readTracks(
    geometryTracks(geometry, trackType),
    measurements[trackType],
  );
  const inserted = insertTrack(tracks, { index, position }, size, trackType);
  if (!inserted.ok) {
    return inserted;
  }

  const insertUpdates = shiftItemsForInsertedTrack(
    geometry.items,
    trackType,
    index,
    position,
  );

  let current = applyGeometryUpdates(geometry, insertUpdates);
  if (inserted.value) {
    current = withTracks(current, trackType, inserted.value.tracks);
  }

  const adjustment = position === "before" ? -1 : 1;
  const anchorUpdates: GridGeometryUpdate[] = [];
  for (const id of resizeItemIds) {
    const item = findGeometryItem(current, id);
    if (item === undefined) {
      return failure("ITEM_NOT_FOUND", `[GridModel] GridItem #${id} not found`);
    }
    const { start, end } = item[trackType];
    anchorUpdates.push({ [trackType]: span(start + adjustment, end), id });
  }
  for (const id of contraItemIds) {
    const item = findGeometryItem(current, id);
    if (item === undefined) {
      return failure("ITEM_NOT_FOUND", `[GridModel] GridItem #${id} not found`);
    }
    const { start, end } = item[trackType];
    anchorUpdates.push({ [trackType]: span(start, end + adjustment), id });
  }

  return ok({
    ...trackTransitionFor(trackType, inserted.value),
    anchorUpdates,
    geometry: applyGeometryUpdates(current, anchorUpdates),
    insertUpdates,
  });
};

export interface GridRemoveTrackRequest {
  readonly assignDirection?: GridGeometryAssignDirection;
  readonly trackIndex: number;
  readonly trackType: GridGeometryTrackType;
  readonly updateItems?: boolean;
}

/** Remove a grid track, rebinding items bound to lines beyond it. */
export const removeGridTrack = (
  geometry: GridGeometry,
  {
    assignDirection,
    trackIndex,
    trackType,
    updateItems = true,
  }: GridRemoveTrackRequest,
  measurements: GridMeasurements = NO_MEASUREMENTS,
): GridGeometryResult<GridGeometryTransition> => {
  const tracks = readTracks(
    geometryTracks(geometry, trackType),
    measurements[trackType],
  );
  const removed = removeTrack(tracks, trackIndex, assignDirection, trackType);
  if (!removed.ok) {
    return removed;
  }
  const updates = updateItems
    ? shiftItemsForRemovedTrack(geometry.items, trackType, trackIndex)
    : [];
  return ok({
    ...trackTransitionFor(trackType, removed.value),
    geometry: withTracks(
      applyGeometryUpdates(geometry, updates),
      trackType,
      removed.value.tracks,
    ),
    silentUpdates: [],
    updates,
  });
};
