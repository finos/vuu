import { Avatar, Tooltip } from "@salt-ds/core";
import { HistoryIcon, OverflowMenuIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  useOptionalAuthenticatedUser,
  useOptionalVuuAuthorizations,
} from "@vuu-ui/core";
import cx from "clsx";
import {
  type ButtonHTMLAttributes,
  createContext,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import type { PortalSaveStatus } from "../persistence";
import { usePortalSaveStatus } from "../persistence/PersistenceContext";
import { usePortalLogout } from "../portal-header/usePortalLogout";
import { useOptionalSavedState } from "../saved-state/SavedStateContext";
import {
  type PortalNavFooterVariant,
  useFooterPopover,
} from "./useFooterPopover";

import portalNavUserMenuCss from "./PortalNavUserMenu.css";

const classBase = "vuuPortalNavUserMenu";

export const USER_MENU_OPEN_DELAY_MS = 300;
export const USER_MENU_CLOSE_DELAY_MS = 400;

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

const UserMenuContext = createContext<{ close: () => void } | null>(null);

export interface PortalNavUserMenuItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shown after the label, e.g. a shortcut or status. */
  endAdornment?: ReactNode;
  icon?: ReactNode;
}

/**
 * An item in `PortalNavUserMenu`. Clicking it closes the menu unless the
 * click handler calls `preventDefault()`.
 */
export const PortalNavUserMenuItem = ({
  children,
  className,
  disabled,
  endAdornment,
  icon,
  onClick,
  ...htmlAttributes
}: PortalNavUserMenuItemProps) => {
  const menu = useContext(UserMenuContext);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(event);
    if (!event.defaultPrevented) {
      menu?.close();
    }
  };
  return (
    <button
      {...htmlAttributes}
      aria-disabled={disabled || undefined}
      className={cx(`${classBase}-item`, className)}
      onClick={handleClick}
      role="menuitem"
      tabIndex={-1}
      type="button"
    >
      {icon ? (
        <span aria-hidden className={`${classBase}-itemIcon`}>
          {icon}
        </span>
      ) : null}
      <span className={`${classBase}-itemLabel`}>{children}</span>
      {endAdornment ? (
        <span className={`${classBase}-itemEnd`}>{endAdornment}</span>
      ) : null}
    </button>
  );
};

/** "Saving…", "Saved just now", "Saved 2m ago"; undefined if never saved. */
export const formatSaveStatus = (
  status: PortalSaveStatus | undefined,
  now: number,
) => {
  if (!status) return undefined;
  if (status.saving) return "Saving…";
  if (status.lastSavedAt === undefined) return undefined;
  const minutes = Math.floor((now - status.lastSavedAt) / 60_000);
  if (minutes < 1) return "Saved just now";
  if (minutes < 60) return `Saved ${minutes}m ago`;
  return `Saved ${Math.floor(minutes / 60)}h ago`;
};

/** Re-renders every 30s while `enabled`, to keep "Saved 2m ago" current. */
const useMinuteClock = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [enabled]);
  return now;
};

export interface PortalNavUserMenuProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** App-supplied account text, e.g. the trading account. */
  account?: ReactNode;
  /**
   * Items shown between **Saved state…** and **Log out**, typically
   * `PortalNavUserMenuItem`s such as Help.
   */
  children?: ReactNode;
  /**
   * Roles shown in the identity header. Default: the Vuu session's
   * authorizations, when there is one.
   */
  roles?: readonly string[];
  /** `rail` shows the avatar only, for the icons-only nav. */
  variant: PortalNavFooterVariant;
}

/**
 * The user menu for the nav footer. Hovering the user row (or avatar in the
 * rail) opens it after 300ms; it closes 400ms after the pointer leaves.
 * Click, Enter or Space open it too, with arrow key navigation.
 */
export const PortalNavUserMenu = ({
  account,
  children,
  className,
  roles: rolesProp,
  variant,
  ...htmlAttributes
}: PortalNavUserMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-nav-user-menu",
    css: portalNavUserMenuCss,
    window: targetWindow,
  });

  const user = useOptionalAuthenticatedUser();
  const authorizations = useOptionalVuuAuthorizations();
  const roles = rolesProp ?? authorizations ?? [];
  const savedState = useOptionalSavedState();
  const saveStatus = usePortalSaveStatus();
  const logout = usePortalLogout();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const displayName = fullName || user?.userName || "User";
  const email = user?.email;

  const { close, floatingProps, open, triggerProps } = useFooterPopover({
    closeDelay: USER_MENU_CLOSE_DELAY_MS,
    focusOnOpen: (floating) =>
      floating.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus(),
    openDelay: USER_MENU_OPEN_DELAY_MS,
    variant,
  });

  const now = useMinuteClock(open);
  const saveStatusText = formatSaveStatus(saveStatus, now);
  const menuLabelId = useId();

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    floatingProps.onKeyDown(event);
    if (event.defaultPrevented) return;
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR),
    ];
    if (items.length === 0) return;
    const index = items.indexOf(
      event.currentTarget.ownerDocument.activeElement as HTMLElement,
    );
    let next: number | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % items.length;
        break;
      case "ArrowUp":
        next = index <= 0 ? items.length - 1 : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      case "Tab":
        close();
        return;
    }
    if (next !== undefined) {
      event.preventDefault();
      items[next].focus();
    }
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    triggerProps.onKeyDown(event);
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      triggerProps.onClick();
    }
  };

  const rail = variant === "rail";

  const trigger = (
    <button
      {...triggerProps}
      aria-haspopup="menu"
      aria-label={rail ? `User menu: ${displayName}` : undefined}
      className={`${classBase}-trigger`}
      onKeyDown={onTriggerKeyDown}
      type="button"
    >
      <Avatar aria-hidden name={displayName} size={1} />
      {rail ? null : (
        <>
          <span className={`${classBase}-who`}>
            <span className={`${classBase}-name`}>{displayName}</span>
            {account ? (
              <span className={`${classBase}-account`}>{account}</span>
            ) : null}
          </span>
          <OverflowMenuIcon aria-hidden className={`${classBase}-more`} />
        </>
      )}
    </button>
  );

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${variant}`, className)}
    >
      {rail ? (
        <Tooltip content={displayName} disabled={open} placement="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      {open ? (
        <UserMenuContext.Provider value={{ close: () => close(true) }}>
          <div
            {...floatingProps}
            aria-labelledby={menuLabelId}
            className={`${classBase}-panel`}
            onKeyDown={onMenuKeyDown}
            role="menu"
            tabIndex={-1}
          >
            <div className={`${classBase}-identity`} role="none">
              <Avatar aria-hidden name={displayName} size={1.25} />
              <div className={`${classBase}-identityText`}>
                <span className={`${classBase}-name`} id={menuLabelId}>
                  {displayName}
                </span>
                {email ? (
                  <span className={`${classBase}-email`}>{email}</span>
                ) : null}
                {account ? (
                  <span className={`${classBase}-account`}>{account}</span>
                ) : null}
                {roles.length > 0 ? (
                  <ul aria-label="Roles" className={`${classBase}-roles`}>
                    {roles.map((role) => (
                      <li className={`${classBase}-role`} key={role}>
                        {role}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            {savedState ? (
              <div className={`${classBase}-group`} role="group">
                <PortalNavUserMenuItem
                  endAdornment={
                    saveStatusText ? (
                      <span
                        className={`${classBase}-saveStatus`}
                        data-saving={saveStatus?.saving || undefined}
                      >
                        {saveStatusText}
                      </span>
                    ) : undefined
                  }
                  icon={<HistoryIcon />}
                  onClick={() => savedState.open()}
                >
                  Saved state…
                </PortalNavUserMenuItem>
              </div>
            ) : null}
            {children ? (
              <div className={`${classBase}-group`} role="group">
                {children}
              </div>
            ) : null}
            <div className={`${classBase}-group`} role="group">
              <PortalNavUserMenuItem
                className={`${classBase}-logout`}
                onClick={() => void logout()}
              >
                Log out
              </PortalNavUserMenuItem>
            </div>
          </div>
        </UserMenuContext.Provider>
      ) : null}
    </div>
  );
};
