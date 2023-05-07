import { ReactElement } from "react";
import {
  getIntrinsicSize,
  hasUnboundedFlexStyle,
} from "../layout-reducer/flexUtils";
import { getProp } from "../utils";
import type { BreakPoint, ContentMeta } from "./flexboxTypes";

const NO_INTRINSIC_SIZE: {
  height?: number;
  width?: number;
} = {};

export const SPLITTER = 1;
export const PLACEHOLDER = 2;

const isIntrinsicallySized = (item: ContentMeta) =>
  typeof item.intrinsicSize === "number";

const getBreakPointValues = (
  breakPoints: BreakPoint[],
  component: ReactElement
) => {
  const values: { [key: string]: number | undefined } = {};
  breakPoints.forEach((breakPoint) => {
    values[breakPoint] = getProp(component, breakPoint);
  });
  return values;
};

export const gatherChildMeta = (
  children: ReactElement[],
  dimension: "width" | "height",
  breakPoints?: BreakPoint[]
) => {
  return children.map((child, index) => {
    const resizeable = getProp(child, "resizeable");
    const { [dimension]: intrinsicSize } =
      getIntrinsicSize(child) ?? NO_INTRINSIC_SIZE;
    const flexOpen = hasUnboundedFlexStyle(child);
    if (breakPoints) {
      return {
        index,
        flexOpen,
        intrinsicSize,
        resizeable,
        ...getBreakPointValues(breakPoints, child),
      };
    } else {
      return { index, flexOpen, intrinsicSize, resizeable };
    }
  });
};

// Splitters are inserted AFTER the associated index, so
// never a splitter in last position.
// Placeholder goes before (first) OR after(last) index
export const findSplitterAndPlaceholderPositions = (
  childMeta: ContentMeta[]
) => {
  const count = childMeta.length;
  const allIntrinsic = childMeta.every(isIntrinsicallySized);
  const splitterPositions = Array(count).fill(0);
  if (allIntrinsic) {
    splitterPositions[0] = PLACEHOLDER;
    splitterPositions[count - 1] = PLACEHOLDER;
  }
  if (count < 2) {
    return splitterPositions;
  } else {
    // 1) From the left, check each item.
    // Once we hit a resizable item, set this index and all subsequent indices,
    // except for last, to SPLITTER
    for (let i = 0, resizeablesLeft = 0; i < count - 1; i++) {
      if (childMeta[i].resizeable && !resizeablesLeft) {
        resizeablesLeft = SPLITTER;
      }
      splitterPositions[i] += resizeablesLeft;
    }
    // 2) Now check from the right. Undo splitter insertion until we reach a point
    // where there is a resizeable to our right.
    for (let i = count - 1; i > 0; i--) {
      if (splitterPositions[i] & SPLITTER) {
        splitterPositions[i] -= SPLITTER;
      }
      if (childMeta[i].resizeable) {
        break;
      }
    }
    return splitterPositions;
  }
};

export const identifyResizeParties = (
  contentMeta: ContentMeta[],
  idx: number
) => {
  const idx1 = getLeadingResizeablePos(contentMeta, idx);
  const idx2 = getTrailingResizeablePos(contentMeta, idx);
  const participants = idx1 !== -1 && idx2 !== -1 ? [idx1, idx2] : undefined;
  const bystanders = identifyResizeBystanders(contentMeta, participants);
  return [participants, bystanders];
};

function identifyResizeBystanders(
  contentMeta: ContentMeta[],
  participants?: number[]
) {
  if (participants) {
    const bystanders = [];
    for (let i = 0; i < contentMeta.length; i++) {
      if (contentMeta[i].flexOpen && !participants.includes(i)) {
        bystanders.push(i);
      }
    }
    return bystanders;
  }
}

function getLeadingResizeablePos(contentMeta: ContentMeta[], idx: number) {
  let pos = idx,
    resizeable = false;
  while (pos >= 1 && !resizeable) {
    pos = pos - 1;
    resizeable = isResizeable(contentMeta, pos);
  }
  return pos;
}

function getTrailingResizeablePos(contentMeta: ContentMeta[], idx: number) {
  let pos = idx,
    resizeable = false;
  const count = contentMeta.length;
  while (pos < count - 1 && !resizeable) {
    pos = pos + 1;
    resizeable = isResizeable(contentMeta, pos);
  }
  return pos === count ? -1 : pos;
}

function isResizeable(contentMeta: ContentMeta[], idx: number): boolean {
  const { placeholder, splitter, resizeable, intrinsicSize } = contentMeta[idx];
  return Boolean(!splitter && !intrinsicSize && (placeholder || resizeable));
}
