import {
  getPositionWithinBox,
  type GridLayoutDropPosition,
  type GridLayoutSplitDirection,
  pointPositionWithinRect,
  queryClosest,
  type rect,
} from "@vuu-ui/vuu-utils";

/**
 * The zones of the drop compass shown over a panel while a template (e.g. a
 * Panels palette row) is dragged over it. The four directions split the
 * panel, the centre stacks the dropped panel with it, as a tab.
 */
export type DropCompassZone = GridLayoutSplitDirection | "centre";

export const DROP_COMPASS_ZONES: readonly DropCompassZone[] = [
  "north",
  "west",
  "centre",
  "east",
  "south",
];

const classBase = "vuuDropCompass";
const COMPASS_QUERY = `:scope > .${classBase}`;
const ZONE_QUERY = "[data-compass-zone]";

/** A target smaller than this, in either dimension, gets a compact compass. */
export const DROP_COMPASS_COMPACT_SIZE = 160;

/** Tile size and gap of the compass, matching GridLayout.css. */
export const DROP_COMPASS_TILE_SIZE = 34;
export const DROP_COMPASS_COMPACT_TILE_SIZE = 22;
export const DROP_COMPASS_GAP = 3;

/** Where the compass is drawn: its centre point, tile size and tile gap. */
export interface DropCompassGeometry {
  centreX: number;
  centreY: number;
  gap: number;
  tileSize: number;
}

const isDropCompassZone = (value: unknown): value is DropCompassZone =>
  typeof value === "string" &&
  DROP_COMPASS_ZONES.includes(value as DropCompassZone);

export const isCompactDropCompass = (width: number, height: number) =>
  height < DROP_COMPASS_COMPACT_SIZE || width < DROP_COMPASS_COMPACT_SIZE;

/**
 * The geometry of the compass over a drop target. Measured from the rendered
 * compass when there is one, otherwise derived from the target rect, over
 * which the compass is centred.
 */
export const getDropCompassGeometry = (
  targetRect: rect,
  compass?: HTMLElement | null,
): DropCompassGeometry => {
  const centreTile = compass?.querySelector<HTMLElement>(
    '[data-compass-zone="centre"]',
  );
  if (compass && centreTile) {
    const { left, top, width, height } = centreTile.getBoundingClientRect();
    if (width > 0 && height > 0) {
      const view = compass.ownerDocument.defaultView;
      const gap = Number.parseFloat(
        view?.getComputedStyle(compass).rowGap ?? "",
      );
      return {
        centreX: left + width / 2,
        centreY: top + height / 2,
        gap: Number.isFinite(gap) ? gap : DROP_COMPASS_GAP,
        tileSize: Math.max(width, height),
      };
    }
  }
  const width = targetRect.right - targetRect.left;
  const height = targetRect.bottom - targetRect.top;
  return {
    centreX: targetRect.left + width / 2,
    centreY: targetRect.top + height / 2,
    gap: DROP_COMPASS_GAP,
    tileSize: isCompactDropCompass(width, height)
      ? DROP_COMPASS_COMPACT_TILE_SIZE
      : DROP_COMPASS_TILE_SIZE,
  };
};

/**
 * The zone of a point within the compass's 3 x 3 grid, or undefined when the
 * point is outside the compass. The centre tile and the gap around it are the
 * centre. Elsewhere in the grid (edge tiles, the gaps between them and the
 * empty corner cells), the dominant axis picks the edge.
 */
const getZoneWithinCompass = (
  clientX: number,
  clientY: number,
  { centreX, centreY, gap, tileSize }: DropCompassGeometry,
): DropCompassZone | undefined => {
  const dx = clientX - centreX;
  const dy = clientY - centreY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const centreExtent = tileSize / 2 + gap;
  if (absX <= centreExtent && absY <= centreExtent) {
    return "centre";
  }
  const compassExtent = tileSize * 1.5 + gap;
  if (absX > compassExtent || absY > compassExtent) {
    return undefined;
  }
  if (absY >= absX) {
    return dy < 0 ? "north" : "south";
  }
  return dx < 0 ? "west" : "east";
};

/**
 * The compass zone of a pointer over a drop target. Over a compass tile, the
 * tile's zone. Within the compass, but between tiles, the zone of the nearest
 * tile, with the gap around the centre tile part of the centre. Beyond the
 * compass, the zone of the target's region under the pointer: an edge region
 * splits, the central region stacks.
 */
export const getDropCompassZone = (
  eventTarget: EventTarget | null,
  clientX: number,
  clientY: number,
  targetRect: rect,
  geometry: DropCompassGeometry = getDropCompassGeometry(targetRect),
): DropCompassZone => {
  const tile =
    typeof (eventTarget as Element | null)?.closest === "function"
      ? queryClosest(eventTarget, ZONE_QUERY)
      : null;
  const tileZone = tile?.dataset.compassZone;
  if (isDropCompassZone(tileZone)) {
    return tileZone;
  }
  const compassZone = getZoneWithinCompass(clientX, clientY, geometry);
  if (compassZone) {
    return compassZone;
  }
  const { pctX, pctY } = pointPositionWithinRect(clientX, clientY, targetRect);
  const position = getPositionWithinBox(
    clientX,
    clientY,
    targetRect,
    pctX,
    pctY,
  );
  return position === "header" ? "centre" : position;
};

/**
 * The GridLayout drop position of a compass zone. A direction splits the
 * target. The centre stacks the dropped panel with the target, as a tab,
 * which is the `header` drop position. A panel already in a stack has no
 * centre zone: drop on its tabs to add to the stack.
 */
export const getDropCompassPosition = (
  zone: DropCompassZone,
  { stacked = false }: { stacked?: boolean } = {},
): GridLayoutDropPosition | undefined =>
  zone === "centre" ? (stacked ? undefined : "header") : zone;

const createCompass = (doc: Document) => {
  const compass = doc.createElement("div");
  compass.className = classBase;
  compass.setAttribute("aria-hidden", "true");
  for (const zone of DROP_COMPASS_ZONES) {
    const tile = doc.createElement("div");
    tile.className = `${classBase}-zone`;
    tile.dataset.compassZone = zone;
    compass.append(tile);
  }
  return compass;
};

export const getDropCompass = (target: HTMLElement) =>
  target.querySelector<HTMLElement>(COMPASS_QUERY);

export interface DropCompassOptions {
  /** The zone under the pointer, highlighted. None when it can't be used. */
  activeZone?: DropCompassZone;
  /** The centre zone can't be used, e.g. on a panel already in a stack. */
  centreDisabled?: boolean;
}

/**
 * Shows the drop compass, centred over a drop target, or updates it.
 * Decorative: the drag hint bar describes the outcome for assistive
 * technology.
 */
export const showDropCompass = (
  target: HTMLElement,
  { activeZone, centreDisabled = false }: DropCompassOptions,
) => {
  let compass = getDropCompass(target);
  if (!compass) {
    compass = createCompass(target.ownerDocument);
    target.append(compass);
  }
  const { height, width } = target.getBoundingClientRect();
  compass.classList.toggle(
    `${classBase}-compact`,
    isCompactDropCompass(width, height),
  );
  if (activeZone) {
    compass.dataset.activeZone = activeZone;
  } else {
    delete compass.dataset.activeZone;
  }
  for (const tile of compass.querySelectorAll<HTMLElement>(ZONE_QUERY)) {
    const zone = tile.dataset.compassZone;
    tile.classList.toggle(`${classBase}-zone-active`, zone === activeZone);
    if (zone === "centre") {
      tile.toggleAttribute("data-disabled", centreDisabled);
    }
  }
  return compass;
};

export const hideDropCompass = (target: HTMLElement) => {
  getDropCompass(target)?.remove();
};
