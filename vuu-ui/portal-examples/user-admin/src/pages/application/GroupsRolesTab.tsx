import {
  Banner,
  BannerContent,
  Button,
  H3,
  Menu,
  MenuGroup,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  StatusIndicator,
  Tag,
  Text,
} from "@salt-ds/core";
import {
  AddIcon,
  ChevronDownIcon,
  CloseIcon,
  LockedIcon,
  UndoIcon,
} from "@salt-ds/icons";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import cx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GroupName,
  plural,
  RoleName,
  StatusText,
} from "../../components/admin-ui/AdminUi";
import { useEditingLock } from "../../components/EditingContext";
import {
  groupLabel,
  groupRoleOperations,
  type GroupRoles,
  groupRolesFor,
} from "../../data/admin-plans";
import {
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type {
  ApplicationDetails,
  ApplicationGroup,
  ApplicationRole,
} from "../../data/applications";
import { NewRoleDialog } from "./NewRoleDialog";

const classBase = "vuuAdminApplication";

const cellKey = (groupId: string, roleId: string) =>
  `${groupId}\u0000${roleId}`;

/** The saved roles with the person's unsaved changes applied. */
const applyOverrides = (
  saved: GroupRoles,
  overrides: ReadonlyMap<string, boolean>,
): GroupRoles =>
  new Map(
    [...saved].map(([groupId, roleIds]) => {
      const next = new Set(roleIds);
      for (const [key, checked] of overrides) {
        const [overrideGroupId, roleId] = key.split("\u0000");
        if (overrideGroupId !== groupId) continue;
        if (checked) next.add(roleId);
        else next.delete(roleId);
      }
      return [groupId, next];
    }),
  );

/** Says what a heading or line is, so groups and roles are never confused. */
const Kind = ({ children }: { children: string }) => (
  <Text className={`${classBase}-kind`} color="secondary" styleAs="label">
    {children}
  </Text>
);

type RoleChange = "added" | "removed" | undefined;

const RoleChip = ({
  change,
  disabled,
  group,
  onToggle,
  role,
}: {
  change: RoleChange;
  disabled: boolean;
  group: string;
  onToggle: () => void;
  role: ApplicationRole;
}) => (
  <li
    className={cx(`${classBase}-roleChip`, {
      [`${classBase}-roleChipAdded`]: change === "added",
      [`${classBase}-roleChipRemoved`]: change === "removed",
    })}
    title={role.description}
  >
    <RoleName>{role.roleName}</RoleName>
    <Button
      appearance="transparent"
      aria-label={
        change === "removed"
          ? `Keep ${role.roleName} in ${group}`
          : `Remove ${role.roleName} from ${group}`
      }
      disabled={disabled}
      onClick={onToggle}
    >
      {change === "removed" ? (
        <UndoIcon aria-hidden />
      ) : (
        <CloseIcon aria-hidden />
      )}
    </Button>
  </li>
);

interface GroupCardProps {
  draft: ReadonlySet<string>;
  disabled: boolean;
  entry: ApplicationDetails;
  group: ApplicationGroup;
  onCreateRole: (group: ApplicationGroup) => void;
  onToggle: (roleId: string, checked: boolean) => void;
  saved: ReadonlySet<string>;
}

/** One group: what it is, and the roles it gives its members. */
const GroupCard = ({
  draft,
  disabled,
  entry,
  group,
  onCreateRole,
  onToggle,
  saved,
}: GroupCardProps) => {
  const label = groupLabel(entry, group);
  const access = entry.accessRole;
  const hasAccess = access ? draft.has(access.roleId) : false;
  const shown = entry.roles.filter(
    ({ roleId }) => draft.has(roleId) || saved.has(roleId),
  );
  const available = entry.roles.filter(({ roleId }) => !draft.has(roleId));
  return (
    <section aria-label={`Group ${label}`} className={`${classBase}-groupCard`}>
      <header className={`${classBase}-groupCardHeader`}>
        <span className="vuuAdminUi-stack">
          <span className={`${classBase}-groupTitle`}>
            <Kind>Group</Kind>
            <GroupName
              name={group.groupName}
              prefix={entry.application.groupPrefix}
            />
          </span>
          {group.description ? (
            <Text color="secondary">{group.description}</Text>
          ) : (
            <Text className={`${classBase}-noDescription`}>No description</Text>
          )}
        </span>
        <Text color="secondary" styleAs="label">
          {plural(group.userCount, "member")}
        </Text>
      </header>
      <div className={`${classBase}-groupRoles`}>
        <Kind>Roles</Kind>
        <ul aria-label={`Roles in ${label}`}>
          {access && hasAccess ? (
            <li
              className={cx(
                `${classBase}-roleChip`,
                `${classBase}-roleChipAccess`,
                {
                  [`${classBase}-roleChipAdded`]: !saved.has(access.roleId),
                },
              )}
              title="Lets members open the application. Every group needs it."
            >
              <LockedIcon aria-hidden />
              <RoleName>{access.roleName}</RoleName>
            </li>
          ) : null}
          {shown.map((role) => {
            const inDraft = draft.has(role.roleId);
            const inSaved = saved.has(role.roleId);
            const change: RoleChange =
              inDraft && !inSaved
                ? "added"
                : !inDraft && inSaved
                  ? "removed"
                  : undefined;
            return (
              <RoleChip
                change={change}
                disabled={disabled}
                group={label}
                key={role.roleId}
                onToggle={() => onToggle(role.roleId, !inDraft)}
                role={role}
              />
            );
          })}
          {group.foreignRoles.map((role) => (
            <li
              className={`${classBase}-roleChip ${classBase}-roleChipForeign`}
              key={role.roleId}
              title={`From ${role.clientIdentifier}, not ${entry.application.title}`}
            >
              <StatusIndicator status="warning" />
              <RoleName>{role.roleName}</RoleName>
            </li>
          ))}
        </ul>
        <span className={`${classBase}-groupActions`}>
          {access && !hasAccess ? (
            <Button
              disabled={disabled}
              onClick={() => onToggle(access.roleId, true)}
            >
              <StatusIndicator status="warning" /> Add missing access role
            </Button>
          ) : null}
          <Menu>
            <MenuTrigger>
              <Button aria-label={`Add role to ${label}`} disabled={disabled}>
                <AddIcon aria-hidden /> Add role <ChevronDownIcon aria-hidden />
              </Button>
            </MenuTrigger>
            <MenuPanel>
              {available.length > 0 ? (
                <MenuGroup label="Roles not in this group">
                  {available.map((role) => (
                    <MenuItem
                      key={role.roleId}
                      onClick={() => onToggle(role.roleId, true)}
                    >
                      {role.roleName}
                    </MenuItem>
                  ))}
                </MenuGroup>
              ) : null}
              <MenuItem
                disabled={!entry.client}
                onClick={() => onCreateRole(group)}
              >
                <AddIcon aria-hidden /> Create a new role…
              </MenuItem>
            </MenuPanel>
          </Menu>
        </span>
      </div>
    </section>
  );
};

/** The application's roles, and which groups grant each one. */
const RolesList = ({
  draft,
  entry,
}: {
  draft: GroupRoles;
  entry: ApplicationDetails;
}) => {
  if (entry.roles.length === 0) {
    return (
      <Text className={`${classBase}-empty`} color="secondary">
        {entry.application.title} has no roles of its own yet.
      </Text>
    );
  }
  return (
    <ul aria-label="Roles" className={`${classBase}-roleList`}>
      {entry.roles.map((role) => {
        const groups = entry.groups.filter((group) =>
          draft.get(group.groupId)?.has(role.roleId),
        );
        return (
          <li className={`${classBase}-roleRow`} key={role.roleId}>
            <span className="vuuAdminUi-stack">
              <Kind>Role</Kind>
              <RoleName>{role.roleName}</RoleName>
            </span>
            <Text color="secondary">
              {role.description || "No description"}
            </Text>
            {groups.length > 0 ? (
              <span className={`${classBase}-roleGroups`}>
                <Text color="secondary" styleAs="label">
                  In
                </Text>
                {groups.map((group) => (
                  <Tag key={group.groupId}>{groupLabel(entry, group)}</Tag>
                ))}
              </span>
            ) : (
              <StatusText status="warning">Not in any group</StatusText>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export interface GroupsRolesTabProps {
  entry: ApplicationDetails;
  onNewGroup: () => void;
}

/**
 * The application's groups, each with the roles it grants, then its roles.
 * Role changes are staged until saved. The access role can be added to a
 * group that lacks it, but not removed.
 */
export const GroupsRolesTab = ({ entry, onNewGroup }: GroupsRolesTabProps) => {
  const rpc = useAdminRpc();
  const setEditing = useEditingLock();
  const { showNotification } = useNotifications();
  const saved = useMemo(() => groupRolesFor(entry), [entry]);
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [newRole, setNewRole] = useState<{ group?: ApplicationGroup }>();
  /** A role just created for a group, added once it loads. */
  const [pendingRole, setPendingRole] = useState<{
    groupId: string;
    roleName: string;
  }>();
  const draft = useMemo(
    () => applyOverrides(saved, overrides),
    [overrides, saved],
  );
  const operations = useMemo(
    () => groupRoleOperations(entry, saved, draft),
    [draft, entry, saved],
  );
  const dirty = operations.length > 0;

  useEffect(() => {
    setEditing(dirty);
  }, [dirty, setEditing]);
  useEffect(() => () => setEditing(false), [setEditing]);

  const toggle = useCallback(
    (groupId: string, roleId: string, checked: boolean) =>
      setOverrides((current) =>
        new Map(current).set(cellKey(groupId, roleId), checked),
      ),
    [],
  );

  useEffect(() => {
    if (!pendingRole) return;
    const role = entry.roles.find(
      ({ roleName }) => roleName === pendingRole.roleName,
    );
    if (role) {
      toggle(pendingRole.groupId, role.roleId, true);
      setPendingRole(undefined);
    }
  }, [entry.roles, pendingRole, toggle]);

  const save = useCallback(async () => {
    setSaving(true);
    const result = await runOperations(rpc, operations);
    setSaving(false);
    if (result.failed) {
      // Saved changes now match the server; keep the rest for a retry.
      const pending = new Set(
        result.remaining.map(({ params }) =>
          cellKey(String(params.groupId), String(params.roleId)),
        ),
      );
      setOverrides(
        (current) => new Map([...current].filter(([key]) => pending.has(key))),
      );
      setError(describeFailure(result));
      showNotification({
        type: "toast",
        status: "error",
        header: "Some changes were not saved",
        content: describeFailure(result),
      });
    } else {
      setOverrides(new Map());
      setError(undefined);
      showNotification({
        type: "toast",
        status: "success",
        header: "Groups updated",
        content: `${plural(result.completed.length, "change")} saved to ${entry.application.title}.`,
      });
    }
  }, [entry.application.title, operations, rpc, showNotification]);

  return (
    <div className={`${classBase}-tab ${classBase}-groupsTab`}>
      <section aria-labelledby="groups-heading" className="vuuAdminUi-stack">
        <div className={`${classBase}-tabHeader`}>
          <div className="vuuAdminUi-stack">
            <H3 id="groups-heading">Groups</H3>
            <Text color="secondary">
              Users join groups. Each group gives its members the roles listed
              on it.
            </Text>
          </div>
          <Button onClick={onNewGroup}>
            <AddIcon aria-hidden /> New group
          </Button>
        </div>
        {entry.groups.length === 0 ? (
          <Banner status="info">
            <BannerContent>
              {entry.application.title} has no groups yet. Create one so users
              can be given access.
            </BannerContent>
          </Banner>
        ) : (
          <div className={`${classBase}-groupCards`}>
            {entry.groups.map((group) => (
              <GroupCard
                disabled={saving}
                draft={draft.get(group.groupId) ?? new Set()}
                entry={entry}
                group={group}
                key={group.groupId}
                onCreateRole={(target) => setNewRole({ group: target })}
                onToggle={(roleId, checked) =>
                  toggle(group.groupId, roleId, checked)
                }
                saved={saved.get(group.groupId) ?? new Set()}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="roles-heading" className="vuuAdminUi-stack">
        <div className={`${classBase}-tabHeader`}>
          <div className="vuuAdminUi-stack">
            <H3 id="roles-heading">Roles</H3>
            <Text color="secondary">
              {entry.client
                ? `Permissions defined on ${entry.application.clientIdentifier}. Add them to groups above.`
                : `Client ${entry.application.clientIdentifier} is missing, so roles cannot be created.`}
            </Text>
          </div>
          <Button disabled={!entry.client} onClick={() => setNewRole({})}>
            <AddIcon aria-hidden /> New role
          </Button>
        </div>
        <RolesList draft={draft} entry={entry} />
      </section>

      <NewRoleDialog
        entry={entry}
        group={newRole?.group}
        onCreated={(roleName, group) => {
          if (group) setPendingRole({ groupId: group.groupId, roleName });
        }}
        onOpenChange={(open) => {
          if (!open) setNewRole(undefined);
        }}
        open={!!newRole}
      />

      {dirty || error ? (
        <div
          className="vuuIdentityAdmin-saveBar"
          role="region"
          aria-label="Unsaved changes"
        >
          <span className="vuuIdentityAdmin-saveBarText">
            {dirty ? (
              <Tag category={11}>
                {plural(operations.length, "unsaved change")}
              </Tag>
            ) : null}
            {error ? (
              <span role="alert">
                <StatusIndicator status="error" /> {error}
              </span>
            ) : (
              <Text color="secondary">
                {operations.map(({ label }) => label).join(" · ")}
              </Text>
            )}
          </span>
          <span className="vuuAdminUi-actions">
            <Button
              disabled={saving || !dirty}
              onClick={() => {
                setOverrides(new Map());
                setError(undefined);
              }}
            >
              Discard
            </Button>
            <Button
              disabled={saving || !dirty}
              onClick={() => void save()}
              sentiment="accented"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
};
