import { ChevronDownIcon } from "@salt-ds/icons";
import cx from "clsx";
import { type ReactNode, useId, useMemo } from "react";
import type {
  PortalNavItem,
  PortalNavSection as PortalNavSectionModel,
} from "../portal-app-switcher/nav-section-utils";
import { describedBy, IndicatorDot, PortalNavEntry } from "./PortalNavEntry";
import type {
  PortalNavDisplayMode,
  PortalNavSectionStyle,
} from "./portal-nav-types";
import { usePortalNavIndicator } from "./usePortalNavIndicator";

const classBase = "vuuPortalNav";
const NO_MODULES: string[] = [];

export interface PortalNavSectionProps {
  activeHref?: string;
  collapsed: boolean;
  displayMode: Exclude<PortalNavDisplayMode, "minimized">;
  onCollapsedChange: (sectionId: string, collapsed: boolean) => void;
  renderBadge?: (item: PortalNavItem) => ReactNode;
  section: PortalNavSectionModel;
  sectionStyle: PortalNavSectionStyle;
}

/** A section of the nav, with a heading unless `sections="none"` or a rail. */
export const PortalNavSection = ({
  activeHref,
  collapsed: collapsedProp,
  displayMode,
  onCollapsedChange,
  renderBadge,
  section,
  sectionStyle,
}: PortalNavSectionProps) => {
  const headingId = useId();
  const listId = useId();
  const indicatorId = useId();
  const rail = displayMode === "icons";
  const showHeading = !rail && sectionStyle !== "none";
  const collapsible = showHeading && sectionStyle === "collapsible";
  const collapsed = collapsible && collapsedProp;

  // A collapsed section shows the dot of its hidden items, except the active one.
  const hiddenModuleIds = useMemo(
    () =>
      collapsed
        ? section.items
            .filter(({ href }) => href !== activeHref)
            .map(({ moduleId }) => moduleId)
        : NO_MODULES,
    [activeHref, collapsed, section.items],
  );
  const sectionIndicator = usePortalNavIndicator(hiddenModuleIds);

  return (
    <div
      className={cx(`${classBase}-section`, {
        [`${classBase}-section-collapsed`]: collapsed,
      })}
      data-section-id={section.id}
    >
      {showHeading ? (
        <div className={`${classBase}-sectionHeading`} id={headingId}>
          {collapsible ? (
            <button
              aria-controls={listId}
              aria-describedby={describedBy(sectionIndicator && indicatorId)}
              aria-expanded={!collapsed}
              className={`${classBase}-sectionToggle`}
              data-portal-nav-focusable=""
              onClick={() => onCollapsedChange(section.id, !collapsed)}
              type="button"
            >
              <span className={`${classBase}-sectionTitle`}>
                {section.title}
              </span>
              <IndicatorDot
                descriptionId={indicatorId}
                indicator={sectionIndicator}
              />
              <ChevronDownIcon
                aria-hidden
                className={`${classBase}-sectionChevron`}
              />
            </button>
          ) : (
            <span className={`${classBase}-sectionTitle`}>{section.title}</span>
          )}
        </div>
      ) : null}
      <ul
        aria-label={showHeading ? undefined : section.title}
        aria-labelledby={showHeading ? headingId : undefined}
        className={`${classBase}-items`}
        hidden={collapsed}
        id={listId}
      >
        {section.items.map((item) => (
          <PortalNavEntry
            active={item.href === activeHref}
            displayMode={displayMode}
            item={item}
            key={item.href}
            renderBadge={renderBadge}
          />
        ))}
      </ul>
    </div>
  );
};
