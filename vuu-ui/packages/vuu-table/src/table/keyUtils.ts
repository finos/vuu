import React from "react";

function union<T>(set1: Set<T>, ...sets: Set<T>[]) {
  const result = new Set(set1);
  for (let set of sets) {
    for (let element of set) {
      result.add(element);
    }
  }
  return result;
}

export const ArrowUp = "ArrowUp";
export const ArrowDown = "ArrowDown";
export const ArrowLeft = "ArrowLeft";
export const ArrowRight = "ArrowRight";
export const Enter = "Enter";
export const Escape = "Escape";
export const Home = "Home";
export const End = "End";
export const PageUp = "PageUp";
export const PageDown = "PageDown";
export const Space = " ";
export const Tab = "Tab";

const actionKeys = new Set(["Enter", "Delete", " "]);
const focusKeys = new Set(["Tab"]);
const arrowLeftRightKeys = new Set(["ArrowRight", "ArrowLeft"]);
const navigationKeys = new Set<NavigationKey>([
  Home,
  End,
  PageUp,
  PageDown,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
]);
const functionKeys = new Set([
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
]);
const specialKeys = union(
  actionKeys,
  navigationKeys,
  arrowLeftRightKeys,
  functionKeys,
  focusKeys
);
export const isCharacterKey = (evt: React.KeyboardEvent): boolean => {
  if (specialKeys.has(evt.key)) {
    return false;
  }
  return evt.key.length === 1 && !evt.ctrlKey && !evt.metaKey && !evt.altKey;
};

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
export type PageKey = "Home" | "End" | "PageUp" | "PageDown";
export type NavigationKey = PageKey | ArrowKey;
const PageKeys = ["Home", "End", "PageUp", "PageDown"];
export const isPagingKey = (key: string): key is PageKey =>
  PageKeys.includes(key);

export const isNavigationKey = (key: string): key is NavigationKey => {
  return navigationKeys.has(key as NavigationKey);
};
