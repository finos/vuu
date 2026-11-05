import cx from "clsx";
import {
  type HTMLAttributes,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  type GridLayoutHeaderLocation,
  GridLayoutItemContext,
} from "./GridLayoutHeaderSlots";

const classBase = "vuuGridLayoutHeaderContribution";

export interface GridLayoutHeaderContributionProps
  extends HTMLAttributes<HTMLDivElement> {
  /**
   * Defaults to `end`, immediately left of the header's own buttons.
   */
  location?: GridLayoutHeaderLocation;
  /**
   * Position relative to other contributions in the same location. Lower
   * values come first; equal values keep mount order.
   */
  order?: number;
}

/**
 * Renders its children into the header of the GridLayoutItem that hosts it.
 * The children stay part of the calling component's React tree, so they keep
 * its context and update when it re-renders. Renders nothing when not hosted
 * in a GridLayoutItem, when the item has no header, or when the location does
 * not apply (for example a `tab-start` contribution in an unstacked item).
 */
export const GridLayoutHeaderContribution = ({
  children,
  className,
  location = "end",
  order,
  style,
  ...htmlAttributes
}: GridLayoutHeaderContributionProps) => {
  const item = useContext(GridLayoutItemContext);
  const slots = item?.slots;
  const itemId = item?.id;

  const subscribe = useCallback(
    (listener: () => void) => slots?.subscribe(listener) ?? (() => undefined),
    [slots],
  );
  const getSnapshot = useCallback(
    () =>
      itemId === undefined ? null : (slots?.getSlot(itemId, location) ?? null),
    [itemId, location, slots],
  );
  const target = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!target) {
    return null;
  }

  return createPortal(
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      data-location={location}
      style={order === undefined ? style : { ...style, order }}
    >
      {children}
    </div>,
    target,
  );
};
