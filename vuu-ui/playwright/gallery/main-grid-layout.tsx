import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { GridLayoutTestFixture } from "../../packages/grid-layout/src/__tests__/__component__/GridLayoutTestFixture";
import {
  MoveExistingItems,
  PaletteSplitAndReplace,
} from "../../showcase/src/examples/GridLayout/GridLayoutScenarios.examples";
import gridLayoutScenariosCss from "../../showcase/src/examples/GridLayout/GridLayoutScenarios.examples.css";
import gridPaletteCss from "../../showcase/src/examples/html/components/GridPalette.css";

type MountParams = {
  props?: Parameters<typeof GridLayoutTestFixture>[0];
  story: string;
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

const showcaseStyle = document.createElement("style");
showcaseStyle.textContent = `${gridLayoutScenariosCss}\n${gridPaletteCss}`;
document.head.append(showcaseStyle);

let root: Root | undefined;

window.mount = async ({ props, story }: MountParams) => {
  const Component =
    story === "GridLayout/Showcase/MoveExistingItems"
      ? MoveExistingItems
      : story === "GridLayout/Showcase/PaletteSplitAndReplace"
        ? PaletteSplitAndReplace
        : GridLayoutTestFixture;
  if (Component === GridLayoutTestFixture && !props) {
    throw new Error("GridLayout fixture props are required");
  }
  root ??= createRoot(rootElement);
  flushSync(() => {
    root?.render(createElement(Component, props));
  });
};

window.unmount = async () => {
  root?.unmount();
  root = undefined;
};
