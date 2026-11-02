import { Avatar, Checkbox, Input, Tag, Text } from "@salt-ds/core";
import { SearchIcon } from "@salt-ds/icons";
import { type ChangeEvent, useDeferredValue, useMemo, useState } from "react";
import {
  type UserSummary,
  userName,
  useUserSearch,
} from "../data/useApplicationUsers";

import "./UserPicker.css";

const classBase = "vuuAdminUserPicker";
/** Rows shown at once; refine the search to see others. */
const VISIBLE_LIMIT = 200;

export const hasAccess = (user: UserSummary, accessRole: string) =>
  user.moduleAccess.split(",").includes(accessRole);

export interface UserPickerProps {
  /** With `includeExisting` false, users who can already open it are hidden. */
  accessRole?: string;
  "aria-label": string;
  includeExisting?: boolean;
  onChange: (selected: ReadonlyMap<string, UserSummary>) => void;
  selected: ReadonlyMap<string, UserSummary>;
}

/** Search users and tick the ones to act on. Selections survive new searches. */
export const UserPicker = ({
  accessRole,
  "aria-label": ariaLabel,
  includeExisting = true,
  onChange,
  selected,
}: UserPickerProps) => {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { error, loading, users } = useUserSearch(deferredSearch);
  const candidates = useMemo(
    () =>
      includeExisting || !accessRole
        ? users
        : users.filter((user) => !hasAccess(user, accessRole)),
    [accessRole, includeExisting, users],
  );
  const visible = candidates.slice(0, VISIBLE_LIMIT);

  const toggle = (user: UserSummary, checked: boolean) => {
    const next = new Map(selected);
    if (checked) next.set(user.userId, user);
    else next.delete(user.userId);
    onChange(next);
  };

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
                label={
                  <span className={`${classBase}-user`}>
                    <Avatar aria-hidden name={userName(user)} size={1} />
                    <span className="vuuAdminUi-stack">
                      <strong>{userName(user)}</strong>
                      <Text color="secondary" styleAs="label">
                        {[user.username, user.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </span>
                    {accessRole && hasAccess(user, accessRole) ? (
                      <Tag bordered>Has access</Tag>
                    ) : null}
                  </span>
                }
                onChange={(event) => toggle(user, event.target.checked)}
              />
            </li>
          );
        })}
      </ul>
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
