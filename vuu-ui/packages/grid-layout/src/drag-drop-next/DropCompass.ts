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

const isDropCompassZone = (value: unknown): value is DropCompassZone =>
  typeof value === "string" &&
  DROP_COMPASS_ZONES.includes(value as DropCompassZone);

/**
 * The compass zone of a pointer over a drop target. Over a compass tile, the
 * tile's zone. Elsewhere, the zone of the target's region under the pointer:
 * an edge region splits, the central region stacks.
 */
export const getDropCompassZone = (
  eventTarget: EventTarget | null,
  clientX: number,
  clientY: number,
  targetRect: rect,
): DropCompassZone => {
  const tile =
    typeof (eventTarget as Element | null)?.closest === "function"
      ? queryClosest(eventTarget, ZONE_QUERY)
      : null;
  const tileZone = tile?.dataset.compassZone;
  if (isDropCompassZone(tileZone)) {
    return tileZone;
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
    height < DROP_COMPASS_COMPACT_SIZE || width < DROP_COMPASS_COMPACT_SIZE,
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
