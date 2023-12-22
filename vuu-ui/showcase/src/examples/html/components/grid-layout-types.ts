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
  value: GridPos;
  expanded: GridPos;
  shrunk: GridPos;
  span: number;
}

export class ResizeItem implements GridPosition {
  protected from: number;
  protected to: number;
  constructor([from, to]: GridPos) {
    this.from = from;
    this.to = to;
  }
  get value(): GridPos {
    return [this.from, this.to];
  }
  get expanded(): GridPos {
    return [this.from, this.to + 1];
  }
  get flip(): GridPos {
    console.log(
      `ResizeItem flip from ${this.from}, to ${this.to} => [${this.from + 1},${
        this.to
      }]`
    );
    return [this.from + 1, this.to];
  }
  get shrunk(): GridPos {
    // return [this.from + 1, this.to];
    return [this.from + 1, this.to + 1];
  }

  get span() {
    return this.to - this.from + 1;
  }
}

export class ContraItem extends ResizeItem {
  get expanded(): GridPos {
    return [this.from, this.to];
  }
  get shrunk(): GridPos {
    return [this.from, this.to + 1];
  }
  get flip(): GridPos {
    console.log(
      `ContraItem flip from ${this.from}, to ${this.to} => [${this.from},${
        this.to + 1
      }]`
    );
    return [this.from, this.to + 1];
  }
}

export class ContraItemOtherColumn extends ResizeItem {
  get expanded(): GridPos {
    return [this.from, this.to + 1];
  }
  get shrunk(): GridPos {
    return [this.from, this.to];
  }
}

export class SiblingItemOtherColumn extends ResizeItem {
  get expanded(): GridPos {
    return [this.from + 1, this.to + 1];
  }
  get shrunk(): GridPos {
    return [this.from, this.to + 1];
  }
}
