import { CellPos } from "@finos/vuu-table-types";
import { getAriaCellPos } from "./table-dom-utils";

/**
 * Used to track the Table cell (if any) with focus.
 */
export interface ICellFocusState {
  el: HTMLElement | null;
  outsideViewport: "above" | "below" | false;
  placeholderEl: HTMLDivElement | null;
  pos: { top: number } | undefined;
  cellPos: CellPos | undefined;
}

export class CellFocusState implements ICellFocusState {
  #cellPos: CellPos | undefined = undefined;
  #el: HTMLElement | null = null;
  outsideViewport: "above" | "below" | false = false;
  placeholderEl: HTMLDivElement | null = null;
  pos: { top: number } | undefined = undefined;

  set cell(cell: HTMLDivElement) {
    this.#el = cell;
    this.#cellPos = getAriaCellPos(cell);
  }

  get cellPos() {
    return this.#cellPos;
  }
  set cellPos(cellPos) {
    this.#cellPos = cellPos;
  }

  get el() {
    return this.#el;
  }
  set el(el) {
    this.#el = el;
  }
}
