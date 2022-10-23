import * as ReactDOM from "react-dom";
import { ToolkitProvider } from "@heswell/uitk-core";

import { getPortalContainer } from "./utils";

const electronAPI = window?.require?.("electron");
let currentPosition = null;
let windowId = 1;

if (electronAPI) {
  electronAPI.ipcRenderer.on("set-position", (evt, position) => {
    currentPosition = position;
  });
}

const createDOMContainer = (x, y) => {
  return getPortalContainer(x, y);
};

const renderDOMPortal = (component, container, x, y, onRender) => {
  // check this first to see if position has changed
  container.style.cssText = `left:${x}px; top:${y}px;position: absolute;`;

  ReactDOM.render(
    <ToolkitProvider>{component}</ToolkitProvider>,
    container,
    onRender
  );
};

const renderElectronPortal = (component, x, y, el, onRender) => {
  let portalContainer = null;
  console.log("render electron");
  electronAPI.ipcRenderer.send("portal-request", "open-popup", "");
  console.log(
    `currentPosition: x ${currentPosition.x} y ${currentPosition.y}, x,y ${x} ${y}`
  );
  const top = y + currentPosition.y + 30,
    left = x + currentPosition.x;
  const windowName = `popup_${windowId++}`;
  //   console.log(`we're in electron, open window ${windowName} at ${x} ${y}`);
  const win = window.open(
    "",
    windowName,
    `top=${top},left=${left},width=140,height=200,frame=false,resizeable,nodeIntegration=no,roundedCorners=false`
  );

  portalContainer = getPortalContainer(0, 0, win);
  const handleRender = () => {
    const targetEl = portalContainer.querySelector("hw-theme > *");
    const { height } = targetEl.getBoundingClientRect();
    win.resizeTo(100, height);
    onRender && onRender();
  };

  ReactDOM.render(
    <ToolkitProvider>{component}</ToolkitProvider>,
    portalContainer,
    handleRender
  );
  return portalContainer;
};

export const renderPortal = electronAPI
  ? renderElectronPortal
  : renderDOMPortal;

export const createContainer = createDOMContainer;
