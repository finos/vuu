import { Checkbox, Tag, Text, ToggleButton } from "@salt-ds/core";
import cx from "clsx";
import {
  setAccessGroups,
  toggleAccessGroup,
  type UserAccess,
} from "../data/admin-plans";
import { roleLabel, rolesGrantedBy } from "../data/admin-plans";
import type { ApplicationDetails } from "../data/applications";
import { AccessTag, AppAvatar, plural } from "./admin-ui/AdminUi";

import "./UserAccessEditor.css";

const classBase = "vuuAdminUserAccess";

/** One application a user can be given, and the groups that grant it. */
export interface AccessOption {
  defaultGroupId?: string;
  entry: ApplicationDetails;
  groups: readonly { groupId: string; label: string }[];
}

export interface UserAccessEditorProps {
  disabled?: boolean;
  draft: UserAccess;
  onChange: (draft: UserAccess) => void;
  options: readonly AccessOption[];
  /** Access as saved; omit for a new user. */
  saved?: UserAccess;
}

const sameGroups = (
  left: ReadonlySet<string> | undefined,
  right: ReadonlySet<string> | undefined,
) =>
  (left?.size ?? 0) === (right?.size ?? 0) &&
  [...(left ?? [])].every((groupId) => right?.has(groupId));

const statusFor = (
  savedGroups: ReadonlySet<string> | undefined,
  draftGroups: ReadonlySet<string> | undefined,
) => {
  const had = (savedGroups?.size ?? 0) > 0;
  const has = (draftGroups?.size ?? 0) > 0;
  if (had && !has) return "Access will be removed";
  if (!had && has) return "New";
  if (!sameGroups(savedGroups, draftGroups)) return "Groups changed";
  return undefined;
};

/**
 * Every application, with the groups the user is in. Ticking an application
 * gives access through its default group; the groups can then be changed.
 */
export const UserAccessEditor = ({
  disabled = false,
  draft,
  onChange,
  options,
  saved,
}: UserAccessEditorProps) => {
  const ordered = [...options].sort((left, right) => {
    const leftHas =
      (saved?.get(left.entry.application.accessRole)?.size ?? 0) > 0;
    const rightHas =
      (saved?.get(right.entry.application.accessRole)?.size ?? 0) > 0;
    return leftHas === rightHas
      ? left.entry.application.title.localeCompare(
          right.entry.application.title,
        )
      : leftHas
        ? -1
        : 1;
  });

  return (
    <ul aria-label="Application access" className={classBase}>
      {ordered.map(({ defaultGroupId, entry, groups }) => {
        const { accessRole, title } = entry.application;
        const draftGroups = draft.get(accessRole);
        const savedGroups = saved?.get(accessRole);
        const hasAccess = (draftGroups?.size ?? 0) > 0;
        const status = saved ? statusFor(savedGroups, draftGroups) : undefined;
        const roles = rolesGrantedBy(entry, draftGroups ?? []);
        const fallbackGroupId = defaultGroupId ?? groups[0]?.groupId;
        return (
          <li
            className={cx(`${classBase}-app`, {
              [`${classBase}-appSelected`]: hasAccess,
              [`${classBase}-appChanged`]: !!status,
            })}
            key={accessRole}
          >
            <div className={`${classBase}-appHeader`}>
              <Checkbox
                aria-label={`Access to ${title}`}
                checked={hasAccess}
                disabled={disabled || groups.length === 0}
                onChange={(event) =>
                  onChange(
                    setAccessGroups(
                      draft,
                      accessRole,
                      event.target.checked && fallbackGroupId
                        ? [fallbackGroupId]
                        : [],
                    ),
                  )
                }
              />
              <AppAvatar application={entry.application} size={1.25} />
              <strong className={`${classBase}-title`}>{title}</strong>
              {status ? <Tag category={11}>{status}</Tag> : null}
              <Text color="secondary" styleAs="label">
                {groups.length === 0
                  ? "No group grants access"
                  : hasAccess
                    ? plural(draftGroups?.size ?? 0, "group")
                    : "No access"}
              </Text>
            </div>
            {hasAccess ? (
              <div className={`${classBase}-details`}>
                <div
                  aria-label={`${title} groups`}
                  className={`${classBase}-groups`}
                  role="group"
                >
                  {groups.map(({ groupId, label }) => (
                    <ToggleButton
                      disabled={disabled}
                      key={groupId}
                      onChange={() =>
                        onChange(toggleAccessGroup(draft, accessRole, groupId))
                      }
                      selected={draftGroups?.has(groupId) ?? false}
                      value={groupId}
                    >
                      {label}
                    </ToggleButton>
                  ))}
                </div>
                <span className="vuuAdminUi-tags">
                  <Text color="secondary" styleAs="label">
                    Gets
                  </Text>
                  <AccessTag />
                  {roles.map((role) => (
                    <Tag key={role.roleId}>{roleLabel(entry, role)}</Tag>
                  ))}
                </span>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};
