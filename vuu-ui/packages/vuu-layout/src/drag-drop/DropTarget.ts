import { rect, rectTuple } from "../common-types";
import { LayoutModel } from "../layout-reducer";
import { getProps, typeOf } from "../utils";
import {
  BoxModel,
  getPosition,
  Measurements,
  Position,
  positionValues,
  RelativeDropPosition
} from "./BoxModel";
import { DragDropRect, DropPos, DropPosTab } from "./dragDropTypes";
import { DragState } from "./DragState";

export const isTabstrip = (dropTarget: DropTarget) =>
  dropTarget.pos.tab &&
  typeOf(dropTarget.component) === "Stack" &&
  dropTarget.pos.position.Header;

const { north, south, east, west } = positionValues;
const eastwest = east + west;
const northsouth = north + south;

export interface DropTargetProps {
  component: LayoutModel;
  pos: DropPos;
  clientRect: DragDropRect;
  nextDropTarget: DropTarget | null;
}

export type GuideLine = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
export interface TargetDropOutline {
  l: number;
  r: number;
  t: number;
  b: number;
  tabLeft?: number;
  tabWidth?: number;
  tabHeight?: number;
  guideLines?: GuideLine;
}

export class DropTarget {
  private active: boolean;

  public box: unknown;
  public clientRect: DragDropRect;
  public component: LayoutModel;
  public dropRect: rectTuple | undefined;
  public nextDropTarget: DropTarget | null;
  public pos: DropPos;

  constructor({
    component,
    pos,
    clientRect /*, closeToTheEdge*/,
    nextDropTarget,
  }: DropTargetProps) {
    this.component = component;
    this.pos = pos;
    this.clientRect = clientRect;
    this.nextDropTarget = nextDropTarget;
    this.active = false;
    this.dropRect = undefined;
  }

  targetTabPos(tab: DropPosTab) {
    const { left: tabLeft, width: tabWidth, positionRelativeToTab } = tab;
    return positionRelativeToTab === RelativeDropPosition.BEFORE
      ? tabLeft
      : tabLeft + tabWidth;
  }

  /**
   * Determine what will be rendered by the dropTargetRenderer
   *
   * @param {*} lineWidth
   * @param {*} dragState
   * @returns {l, t, r, b, tabLeft, tabWidth, tabHeight}
   */
  getTargetDropOutline(
    lineWidth: number,
    dragState?: DragState
  ): TargetDropOutline {
    if (this.pos.tab) {
      return this.getDropTabOutline(lineWidth, this.pos.tab);
    } else if (dragState && dragState.hasIntrinsicSize()) {
      return this.getIntrinsicDropRect(dragState);
    } else {
      const [l, t, r, b] = this.getDropRectOutline(
        lineWidth,
        dragState
      ) as rectTuple;
      return { l, t, r, b };
    }
  }

  getDropTabOutline(lineWidth: number, tab: DropPosTab): TargetDropOutline {
    const {
      clientRect: { top, left, right, bottom, header },
    } = this;

    const inset = 0;
    const gap = Math.round(lineWidth / 2) + inset;

    const t = Math.round(top);
    const l = Math.round(left + gap);
    const r = Math.round(right - gap);
    const b = Math.round(bottom - gap);
    const tabLeft = this.targetTabPos(tab);
    const tabWidth = 60; // should really measure text
    const tabHeight = (header?.bottom ?? 0) - (header?.top ?? 0);
    return { l, t, r, b, tabLeft, tabWidth, tabHeight };
  }

  getIntrinsicDropRect(dragState: DragState): TargetDropOutline {
    const { pos, clientRect: rect } = this;

    const { x, y } = dragState;

    let height = dragState.intrinsicSize?.height ?? 0;
    let width = dragState.intrinsicSize?.height ?? 0;

    if (height && height > rect.height) {
      console.log(`DropTarget: we're going to blow the gaff`);
      height = rect.height;
    } else if (width && width > rect.width) {
      console.log(`DropTarget: we're going to blow the gaff`);
      width = rect.width;
    }

    const left = Math.min(
      rect.right - width,
      Math.max(rect.left, Math.round(pos.x - x.mousePct * width))
    );
    const top = Math.min(
      rect.bottom - height,
      Math.max(rect.top, Math.round(pos.y - y.mousePct * height))
    );
    const [l, t, r, b] = (this.dropRect = [
      left,
      top,
      left + width,
      top + height,
    ]);

    const guideLines: GuideLine = pos.position.EastOrWest
      ? [l, rect.top, l, rect.bottom, r, rect.top, r, rect.bottom]
      : [rect.left, t, rect.right, t, rect.left, b, rect.right, b];

    return { l, r, t, b, guideLines };
  }

  /**
   * @returns  [left, top, right, bottom]
   */
  getDropRectOutline(lineWidth: number, dragState?: DragState) {
    const { pos, clientRect: rect } = this;
    const { width: suggestedWidth, height: suggestedHeight, position } = pos;

    const { width: intrinsicWidth, height: intrinsicHeight } =
      dragState?.intrinsicSize ?? {};
    const sizeHeight = intrinsicHeight ?? suggestedHeight ?? 0;
    const sizeWidth = intrinsicWidth ?? suggestedWidth ?? 0;

    this.dropRect = undefined;

    const { top: t, left: l, right: r, bottom: b } = rect;

    const inset = 0;
    const gap = Math.round(lineWidth / 2) + inset;

    switch (position) {
      case Position.North:
      case Position.Header: {
        const halfHeight = Math.round((b - t) / 2);
        const height = sizeHeight
          ? Math.min(halfHeight, Math.round(sizeHeight))
          : halfHeight;
        return sizeWidth && l + sizeWidth < r
          ? [l + gap, t + gap, l + sizeWidth - gap, t + gap + height] // need flex direction indicator
          : [l + gap, t + gap, r - gap, t + gap + height];
      }
      case Position.West: {
        const halfWidth = Math.round((r - l) / 2);
        const width = sizeWidth
          ? Math.min(halfWidth, Math.round(sizeWidth))
          : halfWidth;
        return sizeHeight && t + sizeHeight < b
          ? [l + gap, t + gap, l - gap + width, t + sizeHeight + gap] // need flex direction indicator
          : [l + gap, t + gap, l - gap + width, b - gap];
      }
      case Position.East: {
        const halfWidth = Math.round((r - l) / 2);
        const width = sizeWidth
          ? Math.min(halfWidth, Math.round(sizeWidth))
          : halfWidth;
        return sizeHeight && t + sizeHeight < b
          ? [r - gap - width, t + gap, r - gap, t + sizeHeight + gap] // need flex direction indicator
          : [r - gap - width, t + gap, r - gap, b - gap];
      }
      case Position.South: {
        const halfHeight = Math.round((b - t) / 2);
        const height = sizeHeight
          ? Math.min(halfHeight, Math.round(sizeHeight))
          : halfHeight;

        return sizeWidth && l + sizeWidth < r
          ? [l + gap, b - gap - height, l + sizeWidth - gap, b - gap] // need flex direction indicator
          : [l + gap, b - gap - height, r - gap, b - gap];
      }
      case Position.Centre: {
        return [l + gap, t + gap, r - gap, b - gap];
      }
      default:
        console.warn(`DropTarget does not recognize position ${position}`);
        return null;
    }
  }

  activate() {
    this.active = true;
    return this;
  }

  toArray(this: DropTarget) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let dropTarget: DropTarget | null = this;
    const dropTargets = [dropTarget];
    // eslint-disable-next-line no-cond-assign
    while ((dropTarget = dropTarget.nextDropTarget)) {
      dropTargets.push(dropTarget);
    }
    return dropTargets;
  }

  static getActiveDropTarget(dropTarget: DropTarget | null): DropTarget | null {
    return dropTarget === null
      ? null
      : dropTarget?.active
      ? dropTarget
      : DropTarget.getActiveDropTarget(dropTarget.nextDropTarget);
  }
}

// Initial entry to this method is always via the app (may be it should be *on* the app)
export function identifyDropTarget(
  x: number,
  y: number,
  rootLayout: LayoutModel,
  measurements: Measurements,
  intrinsicSize?: number,
  validDropTargets?: string[]
) {
  let dropTarget = null;

  const allBoxesContainingPoint = BoxModel.allBoxesContainingPoint(
    rootLayout,
    measurements,
    x,
    y,
    validDropTargets
  );

  if (allBoxesContainingPoint.length) {
    const [component, ...containers] = allBoxesContainingPoint;
    const {
      "data-path": dataPath,
      path = dataPath,
      "data-row-placeholder": isRowPlaceholder,
    } = getProps(component);
    const clientRect = measurements[path];
    const placeholderOrientation =
      intrinsicSize && isRowPlaceholder ? "row" : undefined;
    const pos = getPosition(x, y, clientRect, placeholderOrientation);
    const box = measurements[path];

    const nextDropTarget = ([nextTarget, ...targets]: LayoutModel[]):
      | DropTarget
      | undefined => {
      if (pos.position?.Header || pos.closeToTheEdge) {
        const targetPosition = getTargetPosition(
          nextTarget,
          pos,
          box,
          measurements,
          x,
          y
        );
        if (targetPosition) {
          const [containerPos, clientRect] = targetPosition;

          return new DropTarget({
            component: nextTarget,
            pos: containerPos,
            clientRect,
            nextDropTarget: nextDropTarget(targets) ?? null,
          });
        } else if (targets.length) {
          return nextDropTarget(targets);
        }
      }
    };
    dropTarget = new DropTarget({
      component,
      pos,
      clientRect,
      nextDropTarget: nextDropTarget(containers) ?? null,
    }).activate();
  }

  return dropTarget;
}

function getTargetPosition(
  container: LayoutModel,
  { closeToTheEdge, position }: DropPos,
  box: rect,
  measurements: Measurements,
  x: number,
  y: number
): [DropPos, DragDropRect] | undefined {
  if (!container || container.type === "DraggableLayout") {
    return;
  }

  const containingBox = measurements[container.props.path];
  const closeToTop = closeToTheEdge & positionValues.north;
  const closeToRight = closeToTheEdge & positionValues.east;
  const closeToBottom = closeToTheEdge & positionValues.south;
  const closeToLeft = closeToTheEdge & positionValues.west;

  const atTop =
    (closeToTop || position.Header) &&
    Math.round(box.top) === Math.round(containingBox.top);
  const atRight =
    closeToRight && Math.round(box.right) === Math.round(containingBox.right);
  const atBottom =
    closeToBottom &&
    Math.round(box.bottom) === Math.round(containingBox.bottom);
  const atLeft =
    closeToLeft && Math.round(box.left) === Math.round(containingBox.left);

  if (atTop || atRight || atBottom || atLeft) {
    const { "data-path": dataPath, path = dataPath } = container.props;
    const clientRect = measurements[path];
    const containerPos = getPosition(x, y, clientRect);

    // if its a VBox and we're close to left or right ...
    if (
      (isVBox(container) || isTabbedContainer(container)) &&
      closeToTheEdge & eastwest
    ) {
      containerPos.width = 120;
      return [containerPos, clientRect];
    }
    // if it's a HBox and we're close to top or bottom ...
    else if (
      (isHBox(container) || isTabbedContainer(container)) &&
      (position.Header || closeToTheEdge & northsouth)
    ) {
      containerPos.height = 120;
      return [containerPos, clientRect];
    }
  }
}

function isTabbedContainer(component: LayoutModel) {
  return typeOf(component) === "Stack";
}

function isVBox(component: LayoutModel) {
  return (
    typeOf(component) === "Flexbox" &&
    component.props.style.flexDirection === "column"
  );
}

function isHBox(component: LayoutModel) {
  return (
    typeOf(component) === "Flexbox" &&
    component.props.style.flexDirection === "row"
  );
}
