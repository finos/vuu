import * as ReactDOM from "react-dom";
import { ReactElement } from "react";

let containerId = 1;

const getPortalContainer = (x = 0, y = 0, win = window) => {
  const el = win.document.createElement("div");
  el.className = "vuuPopup " + containerId++;
  el.style.cssText = `left:${x}px; top:${y}px;`;
  win.document.body.appendChild(el);
  return el;
};

const createDOMContainer = (x?: number, y?: number) => getPortalContainer(x, y);

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

export const createContainer = createDOMContainer;
