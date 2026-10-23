import type { ReactNode } from "react";
import type { PortalNavItem } from "../portal-app-switcher/nav-section-utils";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";

export type PortalNavDisplayMode =
  | "icons-and-text"
  | "text"
  | "icons"
  | "minimized";

export type PortalNavCollapsedMode = Extract<
  PortalNavDisplayMode,
  "icons" | "minimized"
>;

export type PortalNavDensity = "comfortable" | "compact";

export type PortalNavSectionStyle = "headings" | "collapsible" | "none";

/** Passed to the `brand` and `footer` render functions. */
export interface PortalNavSlotContext {
  allowedDisplayModes: readonly PortalNavDisplayMode[];
  displayMode: PortalNavDisplayMode;
  setDisplayMode: (displayMode: PortalNavDisplayMode) => void;
}

export type PortalNavSlot =
  | ReactNode
  | ((context: PortalNavSlotContext) => ReactNode);

export interface PortalNavProps {
  /** Modes the user may switch between. Defaults to all four. */
  allowedDisplayModes?: readonly PortalNavDisplayMode[];
  /**
   * Below this viewport width (px), the expanded modes show as the `icons`
   * rail. Transient: the user's chosen mode is kept.
   */
  autoCollapseBelow?: number;
  /** Logo, product name, environment chip etc. at the top of the nav. */
  brand?: PortalNavSlot;
  className?: string;
  /** Target of the collapse button and ⌘B / Ctrl+B. Default `icons`. */
  collapseTo?: PortalNavCollapsedMode;
  /** Initial mode when uncontrolled and nothing is saved. */
  defaultDisplayMode?: PortalNavDisplayMode;
  /** 32px rows (`comfortable`, default) or 26px rows (`compact`). */
  density?: PortalNavDensity;
  /** Controlled display mode. */
  displayMode?: PortalNavDisplayMode;
  /** Pinned at the bottom of the nav, e.g. connection status and user menu. */
  footer?: PortalNavSlot;
  onDisplayModeChange?: (displayMode: PortalNavDisplayMode) => void;
  remoteModules: RemoteModuleDescriptor[];
  /**
   * Live value shown with an item, e.g. a working order count or day P&L,
   * usually selected by `item.navBadge`. Return a number for a count: in the
   * `icons` rail a count above zero shows as a pip, other content is hidden.
   */
  renderBadge?: (item: PortalNavItem) => ReactNode;
  /** Section headings (default), collapsible headings, or none. */
  sections?: PortalNavSectionStyle;
  /** Width (px) of the `icons-and-text` mode. Default 248. */
  width?: number;
}

export const DISPLAY_MODE_WIDTHS: Record<PortalNavDisplayMode, number> = {
  "icons-and-text": 248,
  text: 208,
  icons: 60,
  minimized: 0,
};

export const ALL_DISPLAY_MODES: readonly PortalNavDisplayMode[] = [
  "icons-and-text",
  "text",
  "icons",
  "minimized",
];

export const isExpandedMode = (mode: PortalNavDisplayMode) =>
  mode === "icons-and-text" || mode === "text";
