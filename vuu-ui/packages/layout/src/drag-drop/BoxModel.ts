import { ReactElement } from "react";
import { getProps, typeOf } from "../utils";
import { isContainer } from "../registry/ComponentRegistry";
import { LayoutModel } from "../layout-reducer";
import { DragDropRect, DropPos, RelativePosition } from "./dragDropTypes";
import { rect } from "../common-types";

export var positionValues = {
  north: 1,
  east: 2,
  south: 4,
  west: 8,
  header: 16,
  centre: 32,
  absolute: 64,
};

export const RelativeDropPosition = {
  AFTER: "after" as RelativePosition,
  BEFORE: "before" as RelativePosition,
};

export var Position = Object.freeze({
  North: _position("north"),
  East: _position("east"),
  South: _position("south"),
  West: _position("west"),
  Header: _position("header"),
  Centre: _position("centre"),
  Absolute: _position("absolute"),
});

function _position(str: keyof typeof positionValues) {
  return Object.freeze({
    offset:
      str === "north" || str === "west"
        ? 0
        : str === "south" || str === "east"
        ? 1
        : NaN,
    valueOf: function () {
      return positionValues[str];
    },
    toString: function () {
      return str;
    },
    North: str === "north",
    South: str === "south",
    East: str === "east",
    West: str === "west",
    Header: str === "header",
    Centre: str === "centre",
    NorthOrSouth: str === "north" || str === "south",
    EastOrWest: str === "east" || str === "west",
    NorthOrWest: str === "north" || str === "west",
    SouthOrEast: str === "east" || str === "south",
    Absolute: str === "absolute",
  });
}

var NORTH = Position.North,
  SOUTH = Position.South,
  EAST = Position.East,
  WEST = Position.West,
  HEADER = Position.Header,
  CENTRE = Position.Centre;

export interface Measurements {
  [key: string]: DragDropRect;
}

export class BoxModel {
  //TODO we should accept initial let,top offsets here
  // if dropTargets are supplied, we will only allow drop operations directly on these targets
  // TODO we will need to make this more flexible e.g allowing drop anywhere within these target
  static measure(
    model: ReactElement,
    dropTargetPaths: string[] = []
  ): Measurements {
    var measurements: Measurements = {};
    measureRootComponent(model, measurements, dropTargetPaths);
    return measurements;
  }

  static allBoxesContainingPoint(
    layout: LayoutModel,
    measurements: Measurements,
    x: number,
    y: number,
    validDropTargets?: string[]
  ) {
    return allBoxesContainingPoint(
      layout,
      measurements,
      x,
      y,
      validDropTargets
    ).reverse();
  }
}

export function pointPositionWithinRect(
  x: number,
  y: number,
  rect: DragDropRect,
  borderZone = 30
) {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const posX = x - rect.left;
  const posY = y - rect.top;
  let closeToTheEdge = 0;

  if (posX < borderZone) closeToTheEdge += 8;
  if (posX > width - borderZone) closeToTheEdge += 2;
  if (posY < borderZone) closeToTheEdge += 1;
  if (posY > height - borderZone) closeToTheEdge += 4;

  return { pctX: posX / width, pctY: posY / height, closeToTheEdge };
}

export function getPosition(
  x: number,
  y: number,
  rect: DragDropRect,
  targetOrientation?: "row" | "column"
): DropPos {
  const { BEFORE, AFTER } = RelativeDropPosition;
  const { pctX, pctY, closeToTheEdge } = pointPositionWithinRect(x, y, rect);
  let position;
  let tab;

  if (targetOrientation === "row") {
    position = pctX < 0.5 ? WEST : EAST;
  } else if (rect.header && containsPoint(rect.header, x, y)) {
    position = HEADER;

    if (rect.Stack) {
      const tabCount = rect.Stack.length;
      if (tabCount === 0) {
        tab = {
          index: -1,
          left: rect.left,
          positionRelativeToTab: AFTER,
          width: 0,
        };
      } else {
        //TODO account for gaps between tabs
        const targetTab = rect.Stack.find(
          ({ left, right }) => x >= left && x <= right
        );
        if (targetTab) {
          const tabWidth = targetTab.right - targetTab.left;
          tab = {
            index: rect.Stack.indexOf(targetTab),
            left: targetTab.left,
            positionRelativeToTab:
              (x - targetTab.left) / tabWidth < 0.5 ? BEFORE : AFTER,
            width: tabWidth,
          };
        } else {
          const lastTab = rect.Stack[tabCount - 1];
          tab = {
            left: lastTab.right,
            width: 0,
            index: tabCount,
            positionRelativeToTab: AFTER,
          };
        }
      }
    } else if (rect.header.titleWidth) {
      const tabWidth = rect.header.titleWidth;
      tab = {
        index: -1,
        left: rect.left,
        positionRelativeToTab:
          (x - rect.left) / tabWidth < 0.5 ? BEFORE : AFTER,
        width: tabWidth,
      };
    } else {
      tab = {
        left: rect.left,
        width: 0,
        positionRelativeToTab: BEFORE,
        index: -1,
      };
    }
  } else {
    position = getPositionWithinBox(x, y, rect, pctX, pctY);
  }

  return { position: position!, x, y, closeToTheEdge, tab };
}

function getPositionWithinBox(
  x: number,
  y: number,
  rect: DragDropRect,
  pctX: number,
  pctY: number
) {
  const centerBox = getCenteredBox(rect, 0.2);
  if (containsPoint(centerBox, x, y)) {
    return CENTRE;
  } else {
    const quadrant = `${pctY < 0.5 ? "north" : "south"}${
      pctX < 0.5 ? "west" : "east"
    }`;

    switch (quadrant) {
      case "northwest":
        return pctX > pctY ? NORTH : WEST;
      case "northeast":
        return 1 - pctX > pctY ? NORTH : EAST;
      case "southeast":
        return pctX > pctY ? EAST : SOUTH;
      case "southwest":
        return 1 - pctX > pctY ? WEST : SOUTH;
      default:
    }
  }
}

function getCenteredBox(
  { right, left, top, bottom }: DragDropRect,
  pctSize: number
) {
  const pctOffset = (1 - pctSize) / 2;
  const w = (right - left) * pctOffset;
  const h = (bottom - top) * pctOffset;
  return { left: left + w, top: top + h, right: right - w, bottom: bottom - h };
}

function measureRootComponent(
  rootComponent: ReactElement,
  measurements: Measurements,
  dropTargets: any[]
) {
  const {
    id,
    "data-path": dataPath,
    path = dataPath,
  } = getProps(rootComponent);
  const type = typeOf(rootComponent) as string;

  if (id && path) {
    const [rect, el] = measureComponentDomElement(rootComponent);
    measureComponent(rootComponent, rect, el, measurements);
    if (isContainer(type)) {
      collectChildMeasurements(rootComponent, measurements, dropTargets);
    }
  }
}

function measureComponent(
  component: LayoutModel,
  rect: DragDropRect,
  el: HTMLElement,
  measurements: Measurements
) {
  const {
    "data-path": dataPath,
    path = dataPath,
    header,
  } = getProps(component);

  measurements[path] = rect;

  const type = typeOf(component);
  if (header || type === "Stack") {
    const headerEl = el.querySelector(".vuuHeader");
    if (headerEl) {
      const { top, left, right, bottom } = headerEl.getBoundingClientRect();
      measurements[path].header = {
        top: Math.round(top),
        left: Math.round(left),
        right: Math.round(right),
        bottom: Math.round(bottom),
      };
      if (type === "Stack") {
        measurements[path].Stack = Array.from(
          headerEl.querySelectorAll(".uitkTab")
        )
          .map((tab) => tab.getBoundingClientRect())
          .map(({ left, right }) => ({ left, right }));
      } else {
        const titleEl = headerEl.querySelector('[class^="vuuHeader-title"]');
        const { header } = measurements[path];
        if (titleEl && header) {
          header.titleWidth = titleEl.clientWidth;
        }
      }
    }
  }

  return measurements[path];
}

function collectChildMeasurements(
  component: LayoutModel,
  measurements: Measurements,
  dropTargets: string[],
  preX = 0,
  posX = 0,
  preY = 0,
  posY = 0
) {
  const {
    children,
    "data-path": dataPath,
    path = dataPath,
    style,
    active = 0,
  } = getProps(component);

  const type = typeOf(component);
  const isFlexbox = type === "Flexbox";
  const isStack = type === "Stack";
  const isTower = isFlexbox && style.flexDirection === "column";
  const isTerrace = isFlexbox && style.flexDirection === "row";

  const childrenToMeasure = isStack
    ? children.filter((_child: ReactElement, idx: number) => idx === active)
    : children.filter(omitDragging);

  type measuredTuple = [DragDropRect, HTMLElement, ReactElement];
  // Collect all the measurements in first pass ...
  const childMeasurements: measuredTuple[] = childrenToMeasure.map(
    (child: ReactElement) => {
      const [rect, el] = measureComponentDomElement(child);

      return [
        {
          ...rect,
          top: rect.top - preY,
          right: rect.right + posX,
          bottom: rect.bottom + posY,
          left: rect.left - preX,
        },
        el,
        child,
      ];
    }
  );

  // ...so that, in the second pass, we can identify gaps ...
  const expandedMeasurements = childMeasurements.map(
    ([rect, el, child], i, all) => {
      // generate a 'local' splitter adjustment for children adjacent to splitters
      let localPreX;
      let localPosX;
      let localPreY;
      let localPosY;
      let gapPre;
      let gapPos;
      const n = all.length - 1;
      if (isTerrace) {
        gapPre = i === 0 ? 0 : rect.left - all[i - 1][0].right;
        gapPos = i === n ? 0 : all[i + 1][0].left - rect.right;
        // we don't need to divide the leading gap, as half the gap will
        // already have been assigned to the preceeding child in the
        // previous loop iteration.
        localPreX = i === 0 ? 0 : gapPre === 0 ? 0 : gapPre;
        localPosX = i === n ? 0 : gapPos === 0 ? 0 : gapPos - gapPos / 2;
        rect.left -= localPreX;
        rect.right += localPosX;
        localPreY = preY;
        localPosY = posY;
      } else if (isTower) {
        gapPre = i === 0 ? 0 : rect.top - all[i - 1][0].bottom;
        gapPos = i === n ? 0 : all[i + 1][0].top - rect.bottom;
        // we don't need to divide the leading gap, as half the gap will
        // already have been assigned to the preceeding child in the
        // previous loop iteration.
        localPreY = i === 0 ? 0 : gapPre === 0 ? 0 : gapPre;
        localPosY = i === n ? 0 : gapPos === 0 ? 0 : gapPos - gapPos / 2;
        rect.top -= localPreY;
        rect.bottom += localPosY;
        localPreX = preX;
        localPosX = posX;
      }

      const componentMeasurements = measureComponent(
        child,
        rect,
        el,
        measurements
      );

      const childType = typeOf(child) as string;
      if (isContainer(childType)) {
        collectChildMeasurements(
          child,
          measurements,
          dropTargets,
          localPreX,
          localPosX,
          localPreY,
          localPosY
        );
      }
      return componentMeasurements;
    }
  );
  if (childMeasurements.length) {
    measurements[path].children = expandedMeasurements;
  }
}

function omitDragging(component: ReactElement) {
  const { id } = getProps(component);
  const el = document.getElementById(id);
  if (el) {
    return el.dataset.dragging !== "true";
  } else {
    console.warn(`BoxModel: no element found with id #${id}`);
    return false;
  }
}

function measureComponentDomElement(
  component: LayoutModel
): [DragDropRect, HTMLElement, LayoutModel] {
  const { id } = getProps(component);
  const type = typeOf(component) as string;
  const el = document.getElementById(id);
  if (!el) {
    throw Error(`No DOM for ${type} ${id}`);
  }
  // Note: height and width are not required for dropTarget identification, but
  // are used in sizing calculations on drop
  let { top, left, right, bottom, height, width } = el.getBoundingClientRect();
  let scrolling = undefined;
  if (isContainer(type)) {
    const scrollHeight = el.scrollHeight;
    if (scrollHeight > height) {
      scrolling = { id, scrollHeight, scrollTop: el.scrollTop };
    }
  }
  return [
    {
      top: Math.round(top),
      left: Math.round(left),
      right: Math.round(right),
      bottom: Math.round(bottom),
      height: Math.round(height),
      width: Math.round(width),
      scrolling,
    },
    el,
    component,
  ];
}

function allBoxesContainingPoint(
  component: LayoutModel,
  measurements: Measurements,
  x: number,
  y: number,
  dropTargets?: string[],
  boxes: LayoutModel[] = []
): LayoutModel[] {
  const {
    children,
    "data-path": dataPath,
    path = dataPath,
  } = getProps(component);

  const type = typeOf(component) as string;
  var rect = measurements[path];
  if (!containsPoint(rect, x, y)) return boxes;

  if (dropTargets && dropTargets.length) {
    if (dropTargets.includes(path)) {
      boxes.push(component);
    } else if (
      dropTargets.some((dropTargetPath) => dropTargetPath.startsWith(path))
    ) {
      // keep going
    } else {
      return boxes;
    }
  } else {
    boxes.push(component);
  }

  if (!isContainer(type)) {
    return boxes;
  }

  if (rect.header && containsPoint(rect.header, x, y)) {
    return boxes;
  }

  if (rect.scrolling) {
    scrollIntoViewIfNeccesary(rect, x, y);
  }

  for (var i = 0; i < children.length; i++) {
    if (type === "Stack" && component.props.active !== i) {
      continue;
    }
    const nestedBoxes = allBoxesContainingPoint(
      children[i],
      measurements,
      x,
      y,
      dropTargets
    );
    if (nestedBoxes.length) {
      return boxes.concat(nestedBoxes);
    }
  }
  return boxes;
}

function containsPoint(rect: rect, x: number, y: number) {
  if (rect) {
    return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
  }
}

function scrollIntoViewIfNeccesary(
  { top, bottom, scrolling }: DragDropRect,
  x: number,
  y: number
) {
  if (scrolling) {
    const { id, scrollTop, scrollHeight } = scrolling;
    const height = bottom - top;
    if (scrollTop === 0 && bottom - y < 50) {
      const scrollMax = scrollHeight - height;
      const el = document.getElementById(id) as HTMLElement;
      el.scrollTo({ left: 0, top: scrollMax, behavior: "smooth" });
      scrolling.scrollTop = scrollMax;
    } else if (scrollTop > 0 && y - top < 50) {
      const el = document.getElementById(id) as HTMLElement;
      el.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      scrolling.scrollTop = 0;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
