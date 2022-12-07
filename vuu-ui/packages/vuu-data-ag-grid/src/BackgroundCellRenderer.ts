import {
  AgPromise,
  ICellRendererComp,
  ICellRendererParams,
} from "ag-grid-community";

import { roundDecimal } from "@finos/vuu-datagrid";
import {
  getMovingValueDirection,
  isValidNumber,
  valueChangeDirection,
  DOWN1,
  DOWN2,
  UP1,
  UP2,
} from "@finos/vuu-utils";

import "./BackgroundCellRenderer.css";

const dummyEl = document.createElement("div");
const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);

export class BackgroundCellRenderer implements ICellRendererComp {
  private rootEl: HTMLDivElement = dummyEl;
  private flasherEl: HTMLDivElement = dummyEl;
  private contentEl: HTMLDivElement = dummyEl;
  private currentValue: number | undefined = undefined;
  private currentDirection: valueChangeDirection | undefined = undefined;

  getGui(): HTMLElement {
    return this.rootEl as HTMLElement;
  }

  init(params: ICellRendererParams<unknown, number>): void | AgPromise<void> {
    this.currentValue = params.value;
    this.rootEl = document.createElement("div");
    this.flasherEl = document.createElement("div");
    this.flasherEl.className = "flasher";
    this.contentEl = document.createElement("div");
    this.contentEl.className = "num";
    this.contentEl.innerText = roundDecimal(params.value);

    this.rootEl.appendChild(this.flasherEl);
    this.rootEl.appendChild(this.contentEl);
  }
  refresh(params: ICellRendererParams<any, any>): boolean {
    const direction =
      isValidNumber(params.value) && isValidNumber(this.currentValue)
        ? getMovingValueDirection(
            params.value,
            this.currentDirection,
            this.currentValue
          )
        : "";

    const arrow =
      direction === UP1 || direction === UP2
        ? CHAR_ARROW_UP
        : direction === DOWN1 || direction === DOWN2
        ? CHAR_ARROW_DOWN
        : "";

    this.currentValue = params.value;
    this.currentDirection = direction;

    this.rootEl.className = direction;
    this.flasherEl.innerText = arrow;
    this.contentEl.innerText = params.value;

    return true;
  }
}
