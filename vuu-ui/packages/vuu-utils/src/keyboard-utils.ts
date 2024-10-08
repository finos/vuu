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

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
export type PageKey = "Home" | "End" | "PageUp" | "PageDown";

export const isArrowKey = (key: string): key is ArrowKey =>
  key === "ArrowUp" ||
  key === "ArrowDown" ||
  key === "ArrowLeft" ||
  key === "ArrowRight";
