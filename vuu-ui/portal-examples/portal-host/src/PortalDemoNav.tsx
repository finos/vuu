import type { Mode } from "@salt-ds/core";
import type { RemoteModuleDescriptor } from "@vuu-ui/core";
import {
  NotificationsIndicator,
  PortalConnectionStatus,
  PortalNav,
  type PortalNavDisplayMode,
  type PortalNavSlotContext,
  PortalNavUserMenu,
  PortalNavUserMenuItem,
} from "@vuu-ui/core/portal";
import { useCallback } from "react";

/** Icons and text, collapsing to icons only (⌘B / Ctrl+B). */
const DISPLAY_MODES: readonly PortalNavDisplayMode[] = [
  "icons-and-text",
  "icons",
];

const THEME_MODE_LABELS: Record<Mode, string> = {
  light: "Light theme",
  dark: "Dark theme",
};

interface ThemeModeItemsProps {
  onChange: (mode: Mode) => void;
  themeMode: Mode;
}

const ThemeModeItems = ({ onChange, themeMode }: ThemeModeItemsProps) =>
  (["light", "dark"] as const).map((mode) => (
    <PortalNavUserMenuItem
      aria-current={mode === themeMode || undefined}
      endAdornment={mode === themeMode ? "✓" : undefined}
      key={mode}
      onClick={() => onChange(mode)}
    >
      {THEME_MODE_LABELS[mode]}
    </PortalNavUserMenuItem>
  ));

const Brand = ({ displayMode }: PortalNavSlotContext) =>
  displayMode === "icons" ? (
    <NotificationsIndicator compactStyle="bell" scope="unclaimed" />
  ) : (
    <>
      <span className="portalDemoNavBrand-name">Vuu Portal Demo</span>
      <NotificationsIndicator
        className="portalDemoNavBrand-bell"
        compactStyle="bell"
        scope="unclaimed"
      />
    </>
  );

export interface PortalDemoNavProps {
  onThemeModeChange: (mode: Mode) => void;
  remoteModules: RemoteModuleDescriptor[];
  themeMode: Mode;
}

/**
 * PortalNav with the portal title and notifications bell, and connection
 * status and user menu in the footer. The user menu chooses the light or
 * dark theme.
 */
export const PortalDemoNav = ({
  onThemeModeChange,
  remoteModules,
  themeMode,
}: PortalDemoNavProps) => {
  const footer = useCallback(
    ({ displayMode }: PortalNavSlotContext) => {
      const variant = displayMode === "icons" ? "rail" : "expanded";
      return (
        <>
          <PortalConnectionStatus variant={variant} />
          <PortalNavUserMenu variant={variant}>
            <ThemeModeItems
              onChange={onThemeModeChange}
              themeMode={themeMode}
            />
          </PortalNavUserMenu>
        </>
      );
    },
    [onThemeModeChange, themeMode],
  );

  return (
    <PortalNav
      allowedDisplayModes={DISPLAY_MODES}
      brand={Brand}
      brandLabel="Portal home"
      className="portalDemoNav"
      collapseTo="icons"
      defaultDisplayMode="icons-and-text"
      footer={footer}
      remoteModules={remoteModules}
      sections="collapsible"
    />
  );
};
