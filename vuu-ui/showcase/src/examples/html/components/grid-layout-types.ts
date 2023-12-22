import { getColumn, getRow, ResizeOrientation } from "./grid-dom-utils";

export type GridPos = [number, number];
export type ColItem = {
  id: string;
  col: GridPosition;
  row?: undefined;
};
export type RowItem = {
  col?: undefined;
  id: string;
  row: GridPosition;
};
export type GridItem = ColItem | RowItem;

export interface GridPosition {
  after: (edge: number) => boolean;
  expanded: GridPos;
  includes: (edge: number) => boolean;
  shrunk: GridPos;
  span: number;
  value: GridPos;
}

export class ResizeItem implements GridPosition {
  static fromElement = (el: HTMLElement, orientation: ResizeOrientation) => {
    return orientation === "vertical"
      ? new ResizeItem(getRow(el))
      : new ResizeItem(getColumn(el));
  };
  protected from: number;
  protected to: number;
  constructor([from, to]: GridPos) {
    this.from = from;
    this.to = to;
  }

  get index() {
    return this.value[0] - 1;
  }
  get value(): GridPos {
    return [this.from, this.to];
  }
  get expanded(): GridPos {
    console.log("ResizeItem expanded (add 1+ to 'to')");
    return [this.from, this.to + 1];
  }
  get shrunk(): GridPos {
    // return [this.from + 1, this.to];
    return [this.from + 1, this.to + 1];
  }

  get span() {
    return this.to - this.from;
  }
  after(edge: number) {
    return edge < this.from;
  }
  includes(edge: number) {
    return edge > this.from && edge < this.to;
  }
}

export class ContraItem extends ResizeItem {
  get expanded(): GridPos {
    console.log("ContraItem expanded  (leave as-is)");
    return [this.from, this.to];
  }
  get shrunk(): GridPos {
    return [this.from, this.to + 1];
  }
}

export class ContraItemOtherColumn extends ResizeItem {
  get expanded(): GridPos {
    console.log("ContraItemOtherColumn expanded (add 1+ to 'to')");
    return [this.from, this.to + 1];
  }
  get shrunk(): GridPos {
    return [this.from, this.to];
  }
}

export class SiblingItemOtherColumn extends ResizeItem {
  get expanded(): GridPos {
    console.log("SiblingItemOtherColumn expanded (add 1+ to 'from' and 'to')");
    return [this.from + 1, this.to + 1];
  }
  get shrunk(): GridPos {
    return [this.from, this.to + 1];
  }
}
export class NonAdjacentItem extends ResizeItem {
  get expanded(): GridPos {
    throw Error("NonAdjacent doesnt expand");
  }
  get shrunk(): GridPos {
    throw Error("NonAdjacent doesnt shrink");
  }
}
