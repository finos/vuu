import {
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
  PinIcon,
} from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import cx from "clsx";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useId,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { buildNavSections } from "../portal-app-switcher/nav-section-utils";
import { usePortalShellNav } from "../portal-shell/PortalShellNavContext";
import {
  PORTAL_NAV_POPUP,
  PortalNavWorkspaces,
  WORKSPACES_SECTION_ID,
} from "../portal-workspaces/PortalNavWorkspaces";
import { useServerMonitor } from "../server-monitor/VuuServerMonitorProvider";
import { useOptionalWorkspace } from "../workspace/WorkspaceProvider";
import { describedBy, IndicatorDot } from "./PortalNavEntry";
import { PortalNavSection } from "./PortalNavSection";
import {
  DISPLAY_MODE_WIDTHS,
  type PortalNavDisplayMode,
  type PortalNavProps,
  type PortalNavSlot,
  type PortalNavSlotContext,
} from "./portal-nav-types";
import { usePortalNavDisplayMode } from "./usePortalNavDisplayMode";
import { usePortalNavIndicator } from "./usePortalNavIndicator";
import { usePortalNavSectionCollapse } from "./usePortalNavSectionCollapse";

import navItemPresenceCss from "../portal-app-switcher/PortalAppSwitcher.css";
import portalNavCss from "./PortalNav.css";

const classBase = "vuuPortalNav";
const FOCUSABLE = "[data-portal-nav-focusable]";

const renderSlot = (slot: PortalNavSlot, context: PortalNavSlotContext) =>
  typeof slot === "function" ? slot(context) : slot;

const modeWidth = (mode: PortalNavDisplayMode, width?: number) =>
  mode === "icons-and-text" && width !== undefined
    ? width
    : DISPLAY_MODE_WIDTHS[mode];

/** Arrow keys, Home and End move focus between the nav's links and headings. */
const moveFocus = (event: KeyboardEvent<HTMLElement>) => {
  const { key } = event;
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
    return;
  }
  const focusables = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter((el) => el.closest("[hidden]") === null);
  const index = focusables.indexOf(event.target as HTMLElement);
  if (index === -1) {
    return;
  }
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? focusables.length - 1
        : key === "ArrowDown"
          ? Math.min(index + 1, focusables.length - 1)
          : Math.max(index - 1, 0);
  event.preventDefault();
  focusables[next]?.focus();
};

/**
 * The portal's left navigation: modules grouped into sections, in one of
 * four display modes, sizing the `PortalShell` nav column to match.
 */
export const PortalNav = ({
  allowedDisplayModes: allowedDisplayModesProp,
  autoCollapseBelow,
  brand,
  brandHref = "/",
  brandLabel = "Home",
  className,
  collapseTo = "icons",
  defaultDisplayMode,
  density = "comfortable",
  displayMode: displayModeProp,
  footer,
  onDisplayModeChange,
  remoteModules,
  renderBadge,
  renderItemChildren,
  sections: sectionStyle = "headings",
  width,
  workspaces: showWorkspaces = true,
}: PortalNavProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-nav-v2",
    css: portalNavCss,
    window: targetWindow,
  });
  // Presence styles (unavailable items, status badge, overlay) are shared
  // with PortalAppSwitcher, under the same id so they are injected once.
  useComponentCssInjection({
    testId: "vuu-portal-nav",
    css: navItemPresenceCss,
    window: targetWindow,
  });

  const { allowedDisplayModes, displayMode, setDisplayMode, toggle } =
    usePortalNavDisplayMode({
      allowedDisplayModes: allowedDisplayModesProp,
      autoCollapseBelow,
      collapseTo,
      defaultDisplayMode,
      displayMode: displayModeProp,
      onDisplayModeChange,
    });
  const [collapsedSections, setSectionCollapsed] =
    usePortalNavSectionCollapse();

  const workspace = useOptionalWorkspace();

  const sections = useMemo(
    () => buildNavSections(remoteModules),
    [remoteModules],
  );

  // The monitor prioritises servers in the order the user sees them.
  const monitor = useServerMonitor();
  useEffect(() => {
    monitor?.setDisplayOrder(
      sections.flatMap(({ items }) => items.map(({ moduleId }) => moduleId)),
    );
  }, [monitor, sections]);

  const { pathname } = useLocation();
  const activeHref = useMemo(
    () =>
      sections
        .flatMap(({ items }) => items)
        .reduce<string | undefined>(
          (active, { href }) =>
            pathname.startsWith(href) &&
            (active === undefined || href.length > active.length)
              ? href
              : active,
          undefined,
        ),
    [pathname, sections],
  );

  const minimized = displayMode === "minimized";
  const navWidth = modeWidth(displayMode, width);

  const shellNav = usePortalShellNav();
  useEffect(() => {
    shellNav?.setNavWidth(`${navWidth}px`);
  }, [navWidth, shellNav]);
  useEffect(() => () => shellNav?.setNavWidth(undefined), [shellNav]);

  // Minimized: the edge handle opens the nav as an overlay.
  const [overlayOpen, setOverlayOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const overlayMode: Exclude<PortalNavDisplayMode, "minimized" | "icons"> =
    allowedDisplayModes.includes("icons-and-text") ||
    !allowedDisplayModes.includes("text")
      ? "icons-and-text"
      : "text";

  // biome-ignore lint/correctness/useExhaustiveDependencies: closes on navigation or a mode change
  useEffect(() => {
    setOverlayOpen(false);
  }, [pathname, minimized]);

  useEffect(() => {
    if (!overlayOpen || !targetWindow) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      // Menus and dialogs opened from the nav render outside it.
      const inNavPopup =
        typeof target.closest === "function" &&
        target.closest(`.vuuContextMenuPanel, [${PORTAL_NAV_POPUP}]`) !== null;
      if (!inNavPopup && !rootRef.current?.contains(target)) {
        setOverlayOpen(false);
      }
    };
    targetWindow.document.addEventListener("pointerdown", onPointerDown);
    return () =>
      targetWindow.document.removeEventListener("pointerdown", onPointerDown);
  }, [overlayOpen, targetWindow]);

  const otherModuleIds = useMemo(
    () =>
      minimized && !overlayOpen
        ? sections.flatMap(({ items }) =>
            items
              .filter(({ href }) => href !== activeHref)
              .map(({ moduleId }) => moduleId),
          )
        : [],
    [activeHref, minimized, overlayOpen, sections],
  );
  const handleIndicator = usePortalNavIndicator(otherModuleIds);
  const handleIndicatorId = useId();

  const panelMode = minimized ? overlayMode : displayMode;
  const rail = panelMode === "icons";
  const slotContext: PortalNavSlotContext = {
    allowedDisplayModes,
    displayMode,
    setDisplayMode,
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    // Ignore keys from popups portalled out of the nav, e.g. a dialog.
    if (!event.currentTarget.contains(event.target as Node)) {
      return;
    }
    if (event.key === "Escape" && overlayOpen) {
      setOverlayOpen(false);
      handleRef.current?.focus();
      return;
    }
    moveFocus(event);
  };

  const panel = (
    <nav
      aria-label="Main navigation"
      className={cx(`${classBase}-panel`, {
        [`${classBase}-overlay`]: minimized,
      })}
      data-display-mode={panelMode}
      onKeyDown={onPanelKeyDown}
    >
      <div className={`${classBase}-header`}>
        {brand !== undefined ? (
          <div className={`${classBase}-brand`}>
            {brandHref === false ? null : (
              // Behind the brand content rather than around it, so controls
              // in the brand (e.g. the bell) are not nested in a link.
              <Link
                aria-label={brandLabel}
                className={`${classBase}-brandLink`}
                data-portal-nav-focusable=""
                title={brandLabel}
                to={brandHref}
              />
            )}
            {renderSlot(brand, slotContext)}
          </div>
        ) : null}
        {minimized ? (
          <button
            aria-label="Keep navigation open"
            className={`${classBase}-headerButton`}
            onClick={() => setDisplayMode(overlayMode)}
            title="Keep open"
            type="button"
          >
            <PinIcon aria-hidden />
          </button>
        ) : rail ? (
          <button
            aria-keyshortcuts="Meta+B Control+B"
            aria-label="Expand navigation"
            className={`${classBase}-headerButton`}
            onClick={toggle}
            title="Expand (⌘B / Ctrl+B)"
            type="button"
          >
            <DoubleChevronRightIcon aria-hidden />
          </button>
        ) : (
          <button
            aria-keyshortcuts="Meta+B Control+B"
            aria-label="Collapse navigation"
            className={`${classBase}-headerButton`}
            onClick={toggle}
            title="Collapse (⌘B / Ctrl+B)"
            type="button"
          >
            <DoubleChevronLeftIcon aria-hidden />
          </button>
        )}
      </div>
      <div className={`${classBase}-content`}>
        {showWorkspaces && workspace ? (
          <PortalNavWorkspaces
            collapsed={collapsedSections.includes(WORKSPACES_SECTION_ID)}
            displayMode={panelMode}
            onCollapsedChange={setSectionCollapsed}
            sectionStyle={sectionStyle}
            workspace={workspace}
          />
        ) : null}
        {sections.map((section) => (
          <PortalNavSection
            activeHref={activeHref}
            collapsed={collapsedSections.includes(section.id)}
            displayMode={panelMode}
            key={section.id}
            onCollapsedChange={setSectionCollapsed}
            renderBadge={renderBadge}
            renderItemChildren={renderItemChildren}
            section={section}
            sectionStyle={sectionStyle}
          />
        ))}
      </div>
      {footer !== undefined ? (
        <div className={`${classBase}-footer`}>
          {renderSlot(footer, slotContext)}
        </div>
      ) : null}
    </nav>
  );

  return (
    <ContextMenuProvider>
      <div
        className={cx(
          classBase,
          `${classBase}-${displayMode}`,
          `${classBase}-${density}`,
          `${classBase}-sections-${sectionStyle}`,
          className,
          {
            [`${classBase}-overlayOpen`]: overlayOpen,
          },
        )}
        data-display-mode={displayMode}
        ref={rootRef}
        style={
          {
            "--vuuPortalNav-width": `${navWidth}px`,
            "--vuuPortalNav-overlayWidth": `${modeWidth(overlayMode, width)}px`,
          } as CSSProperties
        }
      >
        {minimized ? (
          <>
            <button
              aria-describedby={describedBy(
                handleIndicator && handleIndicatorId,
              )}
              aria-expanded={overlayOpen}
              aria-label="Open navigation"
              className={`${classBase}-handle`}
              onClick={() => setOverlayOpen((open) => !open)}
              ref={handleRef}
              type="button"
            >
              <IndicatorDot
                descriptionId={handleIndicatorId}
                indicator={handleIndicator}
              />
            </button>
            {overlayOpen ? panel : null}
          </>
        ) : (
          panel
        )}
      </div>
    </ContextMenuProvider>
  );
};
