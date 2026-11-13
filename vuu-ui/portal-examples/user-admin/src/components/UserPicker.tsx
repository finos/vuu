import { Avatar, Checkbox, Input, Tag, Text } from "@salt-ds/core";
import { SearchIcon } from "@salt-ds/icons";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type UserSummary,
  userName,
  useUserSearch,
} from "../data/useApplicationUsers";

import "./UserPicker.css";

const classBase = "vuuAdminUserPicker";
/** Rows shown at once; refine the search to see others. */
const VISIBLE_LIMIT = 200;

export type UserAccessFilter = "all" | "with" | "without";

export const hasAccess = (user: UserSummary, accessRole: string) =>
  user.moduleAccess.split(",").includes(accessRole);

export interface UserPickerProps {
  /** Which users to list, by whether they hold `accessRole`. */
  access?: UserAccessFilter;
  accessRole?: string;
  "aria-label": string;
  onChange: (selected: ReadonlyMap<string, UserSummary>) => void;
  /** Extra content on a user's row, in place of the "Has access" tag. */
  renderDetail?: (user: UserSummary, selected: boolean) => ReactNode;
  selected: ReadonlyMap<string, UserSummary>;
  /**
   * `checkbox` (default) toggles rows independently. `extended` selects one
   * row per click; Shift extends the range and Ctrl/Cmd toggles a row.
   */
  selectionMode?: "checkbox" | "extended";
}

/** Search users and tick the ones to act on. Selections survive new searches. */
export const UserPicker = ({
  accessRole,
  "aria-label": ariaLabel,
  access = "all",
  onChange,
  renderDetail,
  selected,
  selectionMode = "checkbox",
}: UserPickerProps) => {
  const anchor = useRef<string>(undefined);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { error, loading, users } = useUserSearch(deferredSearch);
  const candidates = useMemo(
    () =>
      access === "all" || !accessRole
        ? users
        : users.filter(
            (user) => hasAccess(user, accessRole) === (access === "with"),
          ),
    [access, accessRole, users],
  );
  const visible = candidates.slice(0, VISIBLE_LIMIT);

  const toggle = (user: UserSummary, checked: boolean) => {
    const next = new Map(selected);
    if (checked) next.set(user.userId, user);
    else next.delete(user.userId);
    onChange(next);
  };

  const select = (
    user: UserSummary,
    { ctrl, shift }: { ctrl: boolean; shift: boolean },
  ) => {
    const index = visible.findIndex(({ userId }) => userId === user.userId);
    const from = visible.findIndex(({ userId }) => userId === anchor.current);
    if (shift && from !== -1) {
      const [start, end] = from < index ? [from, index] : [index, from];
      const next = new Map(ctrl ? selected : []);
      for (const row of visible.slice(start, end + 1))
        next.set(row.userId, row);
      onChange(next);
      return;
    }
    anchor.current = user.userId;
    if (ctrl) toggle(user, !selected.has(user.userId));
    else onChange(new Map([[user.userId, user]]));
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (step) {
      const next = visible[index + step];
      if (!next) return;
      event.preventDefault();
      select(next, { ctrl: false, shift: event.shiftKey });
      const row = event.currentTarget.parentElement?.children[index + step];
      if (row instanceof HTMLElement) row.focus();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      select(visible[index], {
        ctrl: event.ctrlKey || event.metaKey,
        shift: event.shiftKey,
      });
    }
  };

  const userLabel = (user: UserSummary, isSelected: boolean) => (
    <span className={`${classBase}-user`}>
      <Avatar aria-hidden name={userName(user)} size={1} />
      <span className="vuuAdminUi-stack">
        <strong>{userName(user)}</strong>
        <Text color="secondary" styleAs="label">
          {[user.username, user.email].filter(Boolean).join(" · ")}
        </Text>
      </span>
      {renderDetail ? (
        renderDetail(user, isSelected)
      ) : accessRole && hasAccess(user, accessRole) ? (
        <Tag bordered>Has access</Tag>
      ) : null}
    </span>
  );

  const extended = selectionMode === "extended";

  return (
    <div className={classBase}>
      <Input
        bordered
        inputProps={{ "aria-label": `Search ${ariaLabel.toLowerCase()}` }}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setSearch(event.target.value)
        }
        placeholder="Search by name, username or email"
        startAdornment={<SearchIcon aria-hidden />}
        value={search}
      />
      {error ? <p role="alert">{error}</p> : null}
      {extended ? (
        <ul
          aria-label={ariaLabel}
          aria-multiselectable
          className={`${classBase}-list ${classBase}-listExtended`}
          role="listbox"
        >
          {visible.map((user, index) => {
            const isSelected = selected.has(user.userId);
            return (
              <li
                aria-selected={isSelected}
                className={isSelected ? `${classBase}-selected` : undefined}
                key={user.userId}
                onClick={(event: MouseEvent) =>
                  select(user, {
                    ctrl: event.ctrlKey || event.metaKey,
                    shift: event.shiftKey,
                  })
                }
                onKeyDown={(event) => onRowKeyDown(event, index)}
                onMouseDown={(event) => {
                  // Stop Shift-click selecting text.
                  if (event.shiftKey) event.preventDefault();
                }}
                role="option"
                tabIndex={
                  isSelected || (selected.size === 0 && index === 0) ? 0 : -1
                }
              >
                {userLabel(user, isSelected)}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul aria-label={ariaLabel} className={`${classBase}-list`}>
          {visible.map((user) => {
            const isSelected = selected.has(user.userId);
            return (
              <li
                className={isSelected ? `${classBase}-selected` : undefined}
                key={user.userId}
              >
                <Checkbox
                  checked={isSelected}
                  label={userLabel(user, isSelected)}
                  onChange={(event) => toggle(user, event.target.checked)}
                />
              </li>
            );
          })}
        </ul>
      )}
      <Text aria-live="polite" color="secondary" styleAs="label">
        {loading
          ? "Loading users..."
          : candidates.length > VISIBLE_LIMIT
            ? `Showing ${VISIBLE_LIMIT} of ${candidates.length.toLocaleString()} users. Refine the search to see others.`
            : candidates.length === 0
              ? "No users match."
              : `${candidates.length.toLocaleString()} ${candidates.length === 1 ? "user" : "users"}`}
      </Text>
    </div>
  );
};
