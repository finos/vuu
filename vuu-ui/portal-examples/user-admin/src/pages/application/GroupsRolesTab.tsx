import {
  Banner,
  BannerContent,
  Button,
  Checkbox,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  H3,
  Input,
  Table as SaltTable,
  StatusIndicator,
  TBody,
  TD,
  Text,
  TH,
  THead,
  TR,
  Tag,
} from "@salt-ds/core";
import { AddIcon, LockedIcon } from "@salt-ds/icons";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import cx from "clsx";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { plural } from "../../components/admin-ui/AdminUi";
import { useEditingLock } from "../../components/EditingContext";
import {
  createRoleOperation,
  groupLabel,
  groupRoleOperations,
  type GroupRoles,
  groupRolesFor,
  matrixRoles,
  roleLabel,
  validateRoleSuffix,
} from "../../data/admin-plans";
import {
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type {
  ApplicationDetails,
  ApplicationRole,
} from "../../data/applications";

const classBase = "vuuAdminApplication";

/** Issue codes about how the application's groups and roles fit together. */
const MATRIX_ISSUES = new Set([
  "group-foreign-roles",
  "group-missing-access-role",
  "no-groups",
  "unused-role",
]);

const cellKey = (groupId: string, roleId: string) =>
  `${groupId}\u0000${roleId}`;

/** The saved roles with the person's unsaved ticks applied. */
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

const NewRoleRow = ({
  columns,
  entry,
}: {
  columns: number;
  entry: ApplicationDetails;
}) => {
  const rpc = useAdminRpc();
  const { showNotification } = useNotifications();
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const prefix = entry.application.groupPrefix;

  const create = useCallback(async () => {
    const trimmed = suffix.trim();
    const invalid = validateRoleSuffix(entry, trimmed);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    const result = await runOperations(rpc, [
      createRoleOperation(entry, trimmed),
    ]);
    setSaving(false);
    if (result.failed) {
      setError(describeFailure(result));
    } else {
      setError(undefined);
      setSuffix("");
      showNotification({
        type: "toast",
        status: "success",
        header: "Role created",
        content: `${prefix}${trimmed} was created. Tick it in a group to grant it.`,
      });
    }
  }, [entry, prefix, rpc, showNotification, suffix]);

  return (
    <TR>
      <TD colSpan={columns}>
        <div className={`${classBase}-newRole`}>
          <FormField validationStatus={error ? "error" : undefined}>
            <FormFieldLabel>New role</FormFieldLabel>
            <Input
              bordered
              disabled={!entry.client || saving}
              inputProps={{
                "aria-label": "New role name",
                onKeyDown: (event) => {
                  if (event.key === "Enter") void create();
                },
              }}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSuffix(event.target.value);
                setError(undefined);
              }}
              placeholder="e.g. approve"
              startAdornment={
                <span className={`${classBase}-prefix`}>{prefix}</span>
              }
              value={suffix}
            />
            <FormFieldHelperText>
              {error ??
                (entry.client
                  ? `Created on ${entry.application.clientIdentifier}.`
                  : `Client ${entry.application.clientIdentifier} is missing, so roles cannot be created.`)}
            </FormFieldHelperText>
          </FormField>
          <Button
            disabled={!entry.client || saving || !suffix.trim()}
            onClick={() => void create()}
          >
            <AddIcon aria-hidden /> Add role
          </Button>
        </div>
      </TD>
    </TR>
  );
};

const RoleHeading = ({
  entry,
  role,
}: {
  entry: ApplicationDetails;
  role: ApplicationRole;
}) =>
  role.kind === "access" ? (
    <span className={`${classBase}-roleHeading`}>
      <LockedIcon aria-hidden />
      <span className="vuuAdminUi-stack">
        <strong>Access</strong>
        <Text color="secondary" styleAs="label">
          {role.roleName} on vuu-portal. Every group needs it.
        </Text>
      </span>
    </span>
  ) : (
    <span className="vuuAdminUi-stack">
      <strong>{roleLabel(entry, role)}</strong>
      <Text color="secondary" styleAs="label">
        {role.description || role.roleName}
      </Text>
    </span>
  );

export interface GroupsRolesTabProps {
  entry: ApplicationDetails;
  onNewGroup: () => void;
}

/**
 * Groups across, roles down: a tick puts a role in a group. Ticks are staged
 * until saved. The access role can be added to a group that lacks it, but not
 * removed.
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
  const draft = useMemo(
    () => applyOverrides(saved, overrides),
    [overrides, saved],
  );
  const operations = useMemo(
    () => groupRoleOperations(entry, saved, draft),
    [draft, entry, saved],
  );
  const roles = matrixRoles(entry);
  const issues = entry.issues.filter(({ code }) => MATRIX_ISSUES.has(code));
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

  const save = useCallback(async () => {
    setSaving(true);
    const result = await runOperations(rpc, operations);
    setSaving(false);
    if (result.failed) {
      // Saved ticks now match the server; keep the rest for a retry.
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
    <div className={`${classBase}-tab`}>
      {issues.length > 0 ? (
        <Banner status="warning">
          <BannerContent>
            <ul className={`${classBase}-issueList`}>
              {issues.map((issue) => (
                <li key={`${issue.code}:${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </BannerContent>
        </Banner>
      ) : null}
      <div className={`${classBase}-tabHeader`}>
        <div className="vuuAdminUi-stack">
          <H3>Groups and the roles they grant</H3>
          <Text color="secondary">
            Users join groups. Every group includes the access role, so its
            members can open {entry.application.title}.
          </Text>
        </div>
        <Button onClick={onNewGroup}>
          <AddIcon aria-hidden /> New group
        </Button>
      </div>

      {entry.groups.length === 0 ? (
        <Banner status="info">
          <BannerContent>
            {entry.application.title} has no groups yet. Create one so users can
            be given access.
          </BannerContent>
        </Banner>
      ) : null}

      <div className={`${classBase}-matrixScroll`}>
        <SaltTable
          aria-label={`${entry.application.title} groups and roles`}
          className={`${classBase}-matrix`}
          divider="tertiary"
        >
          <THead>
            <TR>
              <TH className={`${classBase}-roleColumn`}>Role</TH>
              {entry.groups.map((group) => (
                <TH className={`${classBase}-groupColumn`} key={group.groupId}>
                  <span className="vuuAdminUi-stack">
                    <strong>{groupLabel(entry, group)}</strong>
                    <Text color="secondary" styleAs="label">
                      {plural(group.userCount, "member")}
                    </Text>
                  </span>
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {roles.map((role) => (
              <TR
                className={cx({
                  [`${classBase}-accessRow`]: role.kind === "access",
                })}
                key={role.roleId}
              >
                <TD>
                  <RoleHeading entry={entry} role={role} />
                </TD>
                {entry.groups.map((group) => {
                  const checked =
                    draft.get(group.groupId)?.has(role.roleId) ?? false;
                  const changed =
                    checked !==
                    (saved.get(group.groupId)?.has(role.roleId) ?? false);
                  const locked = role.kind === "access" && checked && !changed;
                  return (
                    <TD
                      className={cx(`${classBase}-cell`, {
                        [`${classBase}-cellChanged`]: changed,
                      })}
                      key={group.groupId}
                    >
                      <Checkbox
                        aria-label={`${role.kind === "access" ? "Access" : roleLabel(entry, role)} in ${groupLabel(entry, group)}`}
                        checked={checked}
                        disabled={saving || locked}
                        onChange={(event) =>
                          toggle(
                            group.groupId,
                            role.roleId,
                            event.target.checked,
                          )
                        }
                      />
                    </TD>
                  );
                })}
              </TR>
            ))}
            {entry.roles.length === 0 ? (
              <TR>
                <TD colSpan={entry.groups.length + 1}>
                  <Text color="secondary">
                    {entry.application.title} has no roles of its own yet.
                  </Text>
                </TD>
              </TR>
            ) : null}
            <NewRoleRow columns={entry.groups.length + 1} entry={entry} />
          </TBody>
        </SaltTable>
      </div>

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
