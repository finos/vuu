import * as ReactDOM from "react-dom";
import { ReactElement } from "react";
import cx from "classnames";

let containerId = 1;

const getPortalContainer = ({
  className,
  dataMode,
  x = 0,
  y = 0,
  win = window,
}: HTMLContainerProps) => {
  const el = win.document.createElement("div");
  el.className = cx(`vuuPopup ${containerId++}`, className);
  el.style.cssText = `left:${x}px; top:${y}px;`;
  if (dataMode) {
    el.dataset.mode = dataMode;
  }
  win.document.body.appendChild(el);
  return el;
};

export interface HTMLContainerProps {
  className?: string;
  dataMode?: string;
  x?: number;
  y?: number;
  win?: typeof globalThis;
}

export const createContainer = (props: HTMLContainerProps) =>
  getPortalContainer(props);

export const renderPortal = (
  component: ReactElement,
  container: HTMLElement,
  x: number,
  y: number,
  onRender?: () => void
) => {
  // check this first to see if position has changed
  container.style.cssText = `left:${x}px; top:${y}px;position: absolute;`;

  ReactDOM.render(component, container, onRender);
};
