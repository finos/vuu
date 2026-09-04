import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { GridLayoutTestFixture } from "../../packages/grid-layout/src/__tests__/__component__/GridLayoutTestFixture";

type MountParams = {
  props?: Parameters<typeof GridLayoutTestFixture>[0];
};

declare global {
  interface Window {
    mount: (params: MountParams) => Promise<void>;
    unmount: () => Promise<void>;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The GridLayout component gallery requires a #root element");
}

let root: Root | undefined;

window.mount = async ({ props }: MountParams) => {
  if (!props) {
    throw new Error("GridLayout fixture props are required");
  }
  root ??= createRoot(rootElement);
  flushSync(() => {
    root?.render(createElement(GridLayoutTestFixture, props));
  });
};

window.unmount = async () => {
  root?.unmount();
  root = undefined;
};
