import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  Tag,
  Text,
} from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { useMemo, useState } from "react";
import {
  AccessTag,
  AppAvatar,
  plural,
} from "../../components/admin-ui/AdminUi";
import { UserPicker } from "../../components/UserPicker";
import {
  accessGroups,
  addToGroupsOperations,
  groupLabel,
  leastPrivilegedGroup,
  type Memberships,
  roleLabel,
  rolesGrantedBy,
} from "../../data/admin-plans";
import {
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type { ApplicationDetails } from "../../data/applications";
import type { UserSummary } from "../../data/useApplicationUsers";

const classBase = "vuuAdminApplication";

export interface GrantAccessDialogProps {
  entry: ApplicationDetails;
  memberships: Memberships;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const GrantAccessContent = ({
  entry,
  memberships,
  onClose,
}: {
  entry: ApplicationDetails;
  memberships: Memberships;
  onClose: () => void;
}) => {
  const rpc = useAdminRpc();
  const { showNotification } = useNotifications();
  const groups = accessGroups(entry);
  const [users, setUsers] = useState<ReadonlyMap<string, UserSummary>>(
    new Map(),
  );
  const [groupIds, setGroupIds] = useState<ReadonlySet<string>>(() => {
    const initial = leastPrivilegedGroup(entry);
    return new Set(initial ? [initial.groupId] : []);
  });
  const [includeExisting, setIncludeExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const selectedGroups = groups.filter(({ groupId }) => groupIds.has(groupId));
  const roles = rolesGrantedBy(entry, groupIds);
  const operations = useMemo(
    () =>
      addToGroupsOperations([...users.values()], selectedGroups, memberships),
    [memberships, selectedGroups, users],
  );

  const grant = async () => {
    setSaving(true);
    const result = await runOperations(rpc, operations);
    setSaving(false);
    if (result.failed) {
      setError(describeFailure(result));
      return;
    }
    showNotification({
      type: "toast",
      status: "success",
      header: "Access granted",
      content: `${plural(users.size, "user")} can now open ${entry.application.title}.`,
    });
    onClose();
  };

  return (
    <>
      <DialogHeader
        description="Choose users, then the groups they join. Every group already includes the access role."
        header={
          <span className={`${classBase}-dialogTitle`}>
            <AppAvatar application={entry.application} size={1.25} />
            Grant access to {entry.application.title}
          </span>
        }
      />
      <DialogContent>
        <div className={`${classBase}-grant`}>
          <section aria-label="Users" className={`${classBase}-grantColumn`}>
            <Text styleAs="label">
              <strong>1 · Users</strong>{" "}
              {users.size > 0 ? <Tag>{users.size} selected</Tag> : null}
            </Text>
            <Checkbox
              checked={includeExisting}
              label="Include users who already have access"
              onChange={(event) => setIncludeExisting(event.target.checked)}
            />
            <UserPicker
              accessRole={entry.application.accessRole}
              aria-label="Users"
              includeExisting={includeExisting}
              onChange={setUsers}
              selected={users}
            />
          </section>
          <section aria-label="Groups" className={`${classBase}-grantColumn`}>
            <Text styleAs="label">
              <strong>2 · Groups</strong>
            </Text>
            {groups.length === 0 ? (
              <p role="alert">
                {entry.application.title} has no group that grants access.
                Create one on the Groups &amp; roles tab first.
              </p>
            ) : null}
            {groups.map((group) => {
              const checked = groupIds.has(group.groupId);
              return (
                <div
                  className={`${classBase}-option${checked ? ` ${classBase}-optionSelected` : ""}`}
                  key={group.groupId}
                >
                  <Checkbox
                    checked={checked}
                    label={
                      <span className="vuuAdminUi-stack">
                        <strong>{groupLabel(entry, group)}</strong>
                        <Text color="secondary" styleAs="label">
                          {plural(group.userCount, "member")}
                        </Text>
                      </span>
                    }
                    onChange={(event) => {
                      const next = new Set(groupIds);
                      if (event.target.checked) next.add(group.groupId);
                      else next.delete(group.groupId);
                      setGroupIds(next);
                    }}
                  />
                  <span className="vuuAdminUi-tags">
                    <AccessTag />
                    {rolesGrantedBy(entry, [group.groupId]).map((role) => (
                      <Tag key={role.roleId}>{roleLabel(entry, role)}</Tag>
                    ))}
                  </span>
                </div>
              );
            })}
          </section>
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </DialogContent>
      <DialogActions>
        <span className={`${classBase}-grantSummary`} aria-live="polite">
          {users.size > 0 && selectedGroups.length > 0 ? (
            <>
              <strong>{plural(users.size, "user")}</strong> join{" "}
              <strong>
                {selectedGroups.map((group) => group.groupName).join(", ")}
              </strong>{" "}
              and get <AccessTag />
              {roles.map((role) => (
                <Tag key={role.roleId}>{roleLabel(entry, role)}</Tag>
              ))}
            </>
          ) : (
            <Text color="secondary">
              Choose at least one user and one group.
            </Text>
          )}
        </span>
        <Button disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={saving || users.size === 0 || selectedGroups.length === 0}
          onClick={() => void grant()}
          sentiment="accented"
        >
          {saving
            ? "Granting..."
            : `Grant access${users.size ? ` to ${plural(users.size, "user")}` : ""}`}
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={onClose} />
    </>
  );
};

/** Picks users and the application groups they join. */
export const GrantAccessDialog = ({
  entry,
  memberships,
  onOpenChange,
  open,
}: GrantAccessDialogProps) => (
  <Dialog
    className={`${classBase}-grantDialog`}
    onOpenChange={onOpenChange}
    open={open}
    size="large"
  >
    {open ? (
      <GrantAccessContent
        entry={entry}
        memberships={memberships}
        onClose={() => onOpenChange(false)}
      />
    ) : null}
  </Dialog>
);
