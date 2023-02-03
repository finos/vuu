import { pointPositionWithinRect } from './BoxModel';
import { DragDropRect } from './dragDropTypes';

const SCALE_FACTOR = 0.4;

export type IntrinsicSizes = {
  height?: number;
  width?: number;
};

interface ZoneRange {
  hi: number;
  lo: number;
}
type DragConstraint = {
  zone: {
    x: ZoneRange;
    y: ZoneRange;
  };
  pos: {
    x: ZoneRange;
    y: ZoneRange;
  };
  mouse: {
    x: ZoneRange;
    y: ZoneRange;
  };
};

interface ExtendedZoneRange {
  lo: boolean;
  hi: boolean;
  mousePct: number;
  mousePos: number;
  pos: number;
}

export class DragState {
  public constraint!: DragConstraint;
  public x!: ExtendedZoneRange;
  public y!: ExtendedZoneRange;
  public intrinsicSize: IntrinsicSizes | undefined;

  constructor(
    zone: DragDropRect,
    mouseX: number,
    mouseY: number,
    measurements: DragDropRect,
    intrinsicSize?: IntrinsicSizes
  ) {
    this.init(zone, mouseX, mouseY, measurements, intrinsicSize);
  }

  init(
    zone: DragDropRect,
    mouseX: number,
    mouseY: number,
    rect: DragDropRect,
    intrinsicSize?: IntrinsicSizes
  ) {
    const { left: x, top: y } = rect;

    const { pctX, pctY } = pointPositionWithinRect(mouseX, mouseY, rect);

    // We are applying a scale factor of 0.4 to the draggee. This is purely a visual
    // effect - the actual box size remains the original size. The 'leading' values
    // represent the difference between the visual scaled down box and the actual box.

    const scaleFactor = SCALE_FACTOR;

    const leadX = pctX * rect.width;
    const trailX = rect.width - leadX;
    const leadY = pctY * rect.height;
    const trailY = rect.height - leadY;

    // When we assign position to rect using css. positioning units are applied to the
    // unscaled shape, so we have to adjust values to take scaling into account.
    const scaledWidth = rect.width * scaleFactor,
      scaledHeight = rect.height * scaleFactor;

    const scaleDiff = 1 - scaleFactor;
    const leadXScaleDiff = leadX * scaleDiff;
    const leadYScaleDiff = leadY * scaleDiff;
    const trailXScaleDiff = trailX * scaleDiff;
    const trailYScaleDiff = trailY * scaleDiff;

    this.intrinsicSize = intrinsicSize;

    this.constraint = {
      zone: {
        x: {
          lo: zone.left,
          hi: zone.right
        },
        y: {
          lo: zone.top,
          hi: zone.bottom
        }
      },

      pos: {
        x: {
          lo: /* left */ zone.left - leadXScaleDiff,
          hi: /* right */ zone.right - rect.width + trailXScaleDiff
        },
        y: {
          lo: /* top */ zone.top - leadYScaleDiff,
          hi: /* bottom */ zone.bottom - rect.height + trailYScaleDiff
        }
      },
      mouse: {
        x: {
          lo: /* left */ zone.left + scaledWidth * pctX,
          hi: /* right */ zone.right - scaledWidth * (1 - pctX)
        },
        y: {
          lo: /* top */ zone.top + scaledHeight * pctY,
          hi: /* bottom */ zone.bottom - scaledHeight * (1 - pctY)
        }
      }
    };

    this.x = {
      pos: x,
      lo: false,
      hi: false,
      mousePos: mouseX,
      mousePct: pctX
    };
    this.y = {
      pos: y,
      lo: false,
      hi: false,
      mousePos: mouseY,
      mousePct: pctY
    };
  }

  outOfBounds() {
    return this.x.lo || this.x.hi || this.y.lo || this.y.hi;
  }

  inBounds() {
    return !this.outOfBounds();
  }

  dropX() {
    return this.dropXY('x');
  }

  dropY() {
    return this.dropXY('y');
  }

  hasIntrinsicSize(): number | undefined {
    return this?.intrinsicSize?.height && this?.intrinsicSize?.width;
  }

  /*
   *  diff = mouse movement, signed int
   *  xy = 'x' or 'y'
   */
  //todo, diff can be calculated in here
  update(xy: 'x' | 'y', mousePos: number) {
    const state = this[xy],
      mouseConstraint = this.constraint.mouse[xy],
      posConstraint = this.constraint.pos[xy],
      previousPos = state.pos;

    const diff = mousePos - state.mousePos;

    //xy==='x' && console.log(`update: state.lo=${state.lo}, mPos=${mousePos}, mC.lo=${mouseConstraint.lo}, prevPos=${previousPos}, diff=${diff} `  );

    if (diff < 0) {
      if (state.lo) {
        /* do nothing */
      } else if (mousePos < mouseConstraint.lo) {
        state.lo = true;
        state.pos = posConstraint.lo;
      } else if (state.hi) {
        if (mousePos < mouseConstraint.hi) {
          state.hi = false;
          state.pos += diff;
        }
      } else {
        state.pos += diff;
      }
    } else if (diff > 0) {
      if (state.hi) {
        /* do nothing */
      } else if (mousePos > mouseConstraint.hi) {
        state.hi = true;
        state.pos = posConstraint.hi;
      } else if (state.lo) {
        if (mousePos > mouseConstraint.lo) {
          state.lo = false;
          state.pos += diff;
        }
      } else {
        state.pos += diff;
      }
    }

    state.mousePos = mousePos;

    return previousPos !== state.pos;
  }

  private dropXY(this: DragState, dir: 'x' | 'y') {
    const pos = this[dir],
      rect = this.constraint.zone[dir];
    // why not do the rounding +/- 1 on the rect initially - this is all it is usef for
    return pos.lo
      ? Math.max(rect.lo, pos.mousePos)
      : pos.hi
      ? Math.min(pos.mousePos, Math.round(rect.hi) - 1)
      : pos.mousePos;
  }
}
