import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  getMovingValueDirection,
  isTypeDescriptor,
  isValidNumber,
  valueChangeDirection,
} from "@vuu-ui/vuu-utils";
import { useEffect, useRef, useState } from "react";

/**
 * A flash is not restarted if the cell flashed in the same direction more
 * recently than this. While a cell keeps changing, its current flash keeps
 * fading rather than restarting on every change. Restarting animations is
 * the main cost of flashing cells at high update rates and adds little
 * information when a value changes several times a second. A change of
 * direction always flashes immediately. Configurable per column with
 * renderer.minFlashInterval (ms), 0 restarts on every change.
 */
export const DEFAULT_MIN_FLASH_INTERVAL = 1000;

/**
 * A cell whose value changes again within this many ms of its previous
 * change is 'hot': instead of flashing it shows a steady tint in the
 * direction of its latest move, with no animation. Configurable per column
 * with renderer.hotInterval (ms), 0 disables the hot state.
 */
export const DEFAULT_HOT_INTERVAL = 500;

/**
 * A hot cell cools down after this many ms without a change: its pale tint
 * fades out. It does not flash, a bold flash always means a move after a
 * quiet spell. Configurable with renderer.hotExitDelay (ms).
 */
export const DEFAULT_HOT_EXIT_DELAY = 1000;

export type HotDirection = "up" | "down";

interface FlashState {
  key: string;
  value: unknown;
  column: RuntimeColumnDescriptor;
  /** last computed move, drives the 1/2 alternation that restarts a flash */
  lastMove: valueChangeDirection;
  /** the flash class actually rendered */
  direction: valueChangeDirection;
  flashStart: number;
  lastChange: number;
  hotUntil: number;
  hotDirection?: HotDirection;
  hot?: HotDirection;
}

const isUp = (direction?: valueChangeDirection) =>
  direction === "up1" || direction === "up2";
const isDown = (direction?: valueChangeDirection) =>
  direction === "down1" || direction === "down2";

const getRendererSetting = (
  { type }: RuntimeColumnDescriptor,
  name: "minFlashInterval" | "hotInterval" | "hotExitDelay",
  defaultValue: number,
) => {
  if (isTypeDescriptor(type) && type.renderer) {
    const value = (type.renderer as unknown as Record<string, unknown>)[name];
    if (typeof value === "number") {
      return value;
    }
  }
  return defaultValue;
};

/**
 * A hot cell gets no further renders once its value stops changing, so
 * something has to re-render it when its hot period ends. One shared
 * interval serves every hot cell, so an update only records the cell's new
 * deadline rather than re-arming a timer. Cells cool down up to
 * COOL_DOWN_RESOLUTION ms after their hot period ends.
 */
const COOL_DOWN_RESOLUTION = 100;
const coolDowns = new Map<object, { until: number; coolDown: () => void }>();
let coolDownTimer: ReturnType<typeof setInterval> | undefined;

const runCoolDowns = () => {
  const now = performance.now();
  for (const [owner, entry] of coolDowns) {
    if (entry.until <= now) {
      coolDowns.delete(owner);
      entry.coolDown();
    }
  }
  if (coolDowns.size === 0 && coolDownTimer !== undefined) {
    clearInterval(coolDownTimer);
    coolDownTimer = undefined;
  }
};

const scheduleCoolDown = (
  owner: object,
  until: number,
  coolDown: () => void,
) => {
  const entry = coolDowns.get(owner);
  if (entry) {
    entry.until = until;
  } else {
    coolDowns.set(owner, { until, coolDown });
  }
  coolDownTimer ??= setInterval(runCoolDowns, COOL_DOWN_RESOLUTION);
};

export function useDirection(
  key: string,
  value: unknown,
  column: RuntimeColumnDescriptor,
): {
  direction: valueChangeDirection;
  hot?: HotDirection;
  /** a hot cell that has just gone quiet, its tint fades out */
  cooling?: HotDirection;
} {
  const ref = useRef<FlashState>(undefined);
  const [, setCoolDownCount] = useState(0);
  const prev = ref.current;
  const sameCell = prev?.key === key && prev?.column === column;

  const { type: dataType } = column;
  const decimals = isTypeDescriptor(dataType)
    ? dataType.formatting?.decimals
    : undefined;

  const move: valueChangeDirection =
    prev && sameCell && isValidNumber(value) && isValidNumber(prev.value)
      ? getMovingValueDirection(value, prev.lastMove, prev.value, decimals)
      : "";
  const changed = move !== "";

  const now = performance.now();
  const hotInterval = getRendererSetting(
    column,
    "hotInterval",
    DEFAULT_HOT_INTERVAL,
  );

  let hotUntil = prev && sameCell ? prev.hotUntil : 0;
  let hotDirection = prev && sameCell ? prev.hotDirection : undefined;
  if (prev && changed && now - prev.lastChange < hotInterval) {
    hotUntil =
      now + getRendererSetting(column, "hotExitDelay", DEFAULT_HOT_EXIT_DELAY);
    hotDirection = isUp(move) ? "up" : "down";
  }
  const hot = now < hotUntil ? hotDirection : undefined;
  const wasHot = sameCell && prev?.hot !== undefined;

  let direction: valueChangeDirection = "";
  let flashStart = 0;
  let cooling: HotDirection | undefined;
  if (hot) {
    // steady tint, no flash animation while the cell is hot
  } else if (prev && wasHot && !changed) {
    cooling = prev.hot;
  } else if (prev && sameCell) {
    const sameDirection =
      (isUp(move) && isUp(prev.direction)) ||
      (isDown(move) && isDown(prev.direction));
    const keepCurrentFlash =
      sameDirection &&
      now - prev.flashStart <
        getRendererSetting(
          column,
          "minFlashInterval",
          DEFAULT_MIN_FLASH_INTERVAL,
        );
    direction = keepCurrentFlash ? prev.direction : move;
    flashStart = keepCurrentFlash ? prev.flashStart : move ? now : 0;
  }

  const lastMove = changed ? move : (prev?.lastMove ?? "");
  const lastChange = changed ? now : prev && sameCell ? prev.lastChange : 0;

  useEffect(() => {
    ref.current = {
      key,
      value,
      column,
      lastMove,
      direction,
      flashStart,
      lastChange,
      hotUntil,
      hotDirection,
      hot,
    };
    if (hot) {
      scheduleCoolDown(ref, hotUntil, () => setCoolDownCount((n) => n + 1));
    }
  });

  useEffect(
    () => () => {
      coolDowns.delete(ref);
    },
    [],
  );

  return { direction, hot, cooling };
}
