/// <reference types="vite/client" />

import { createElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

import {
  LocalDataSourceProvider,
  simulModule,
  testModule,
} from "@vuu-ui/vuu-data-test";
import themeCss from "@vuu-ui/vuu-theme/index.css";
import iconsCss from "@vuu-ui/vuu-icons/index.css";

// Keep the data-test modules in the production bundle so their registration
// side effects are available to showcase stories.
void simulModule;
void testModule;

for (const css of [themeCss, iconsCss]) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
}

type Story = (props: Record<string, unknown>) => ReactNode;
type StoryModule = Record<string, Story>;
type MountParams = { story: string; props?: Record<string, unknown> };

declare global {
  interface Window {
    mount: (params: MountParams) => Promise<void>;
    unmount: () => Promise<void>;
  }
}

const stories = import.meta.glob<StoryModule>(
  "../../showcase/src/examples/**/*.examples.{tsx,jsx}",
  { eager: true },
);
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The component gallery requires a #root element");
}

const storyPath = (file: string) =>
  file
    .replace("../../showcase/src/examples/", "")
    .replace(/\.examples\.\w+$/, "");

async function resolveStory(storyId: string) {
  const separator = storyId.lastIndexOf("/");
  const path = storyId.slice(0, separator);
  const name = storyId.slice(separator + 1);
  const file = Object.keys(stories).find(
    (candidate) =>
      storyPath(candidate) === path || storyPath(candidate).endsWith(`/${path}`),
  );
  const storyModule = file ? stories[file] : undefined;
  return storyModule?.[name];
}

let root: Root | undefined;

window.mount = async ({ story, props = {} }: MountParams) => {
  const Story = await resolveStory(story);

  if (!Story) {
    throw new Error(`Unknown component gallery story: ${story}`);
  }

  root ??= createRoot(rootElement);
  flushSync(() => {
    root?.render(
      <LocalDataSourceProvider>
        {createElement(Story, props)}
      </LocalDataSourceProvider>,
    );
  });
};

window.unmount = async () => {
  root?.unmount();
  root = undefined;
};
