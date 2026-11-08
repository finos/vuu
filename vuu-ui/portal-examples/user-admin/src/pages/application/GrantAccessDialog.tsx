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
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { useMemo, useState } from "react";
import {
  AccessTag,
  AppAvatar,
  GroupName,
  plural,
} from "../../components/admin-ui/AdminUi";
import { type UserAccessFilter, UserPicker } from "../../components/UserPicker";
import {
  accessGroups,
  groupDisplayName,
  groupSelection,
  type Memberships,
  type PendingGroups,
  pendingGroupOperations,
  roleLabel,
  rolesGrantedBy,
  toggleGroupFor,
  type UserChange,
  userChange,
} from "../../data/admin-plans";
import {
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type { ApplicationDetails } from "../../data/applications";
import { type UserSummary, userName } from "../../data/useApplicationUsers";

const classBase = "vuuAdminApplication";

export interface GrantAccessDialogProps {
  entry: ApplicationDetails;
  memberships: Memberships;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const STATUS: Record<
  Exclude<UserChange, "unchanged">,
  { category: number; label: string }
> = {
  new: { category: 1, label: "Granted" },
  revoked: { category: 7, label: "Revoked" },
  updated: { category: 3, label: "Updated" },
};

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
  const prefix = entry.application.groupPrefix;
  const [selected, setSelected] = useState<ReadonlyMap<string, UserSummary>>(
    new Map(),
  );
  // Every user whose groups have been changed, so they can be saved after
  // they are deselected.
  const [touched, setTouched] = useState<ReadonlyMap<string, UserSummary>>(
    new Map(),
  );
  const [pending, setPending] = useState<PendingGroups>(new Map());
  const [access, setAccess] = useState<UserAccessFilter>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const selectedIds = useMemo(() => [...selected.keys()], [selected]);
  const selection = groupSelection(entry, selectedIds, pending, memberships);
  const operations = useMemo(
    () =>
      pendingGroupOperations(
        entry,
        [...touched.values()],
        pending,
        memberships,
      ),
    [entry, memberships, pending, touched],
  );
  const changeOf = (userId: string) =>
    userChange(entry, userId, pending, memberships);
  const counts = (["new", "updated", "revoked"] as const)
    .map((change) => ({
      change,
      count: [...pending.keys()].filter((id) => changeOf(id) === change).length,
    }))
    .filter(({ count }) => count > 0);
  const selectedHasChanges = selectedIds.some((id) => pending.has(id));

  const toggleGroup = (groupId: string) => {
    setPending(
      toggleGroupFor(entry, selectedIds, groupId, pending, memberships),
    );
    setTouched(new Map([...touched, ...selected]));
  };

  const undoSelected = () => {
    const next = new Map(pending);
    for (const id of selectedIds) next.delete(id);
    setPending(next);
  };

  const save = async () => {
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
      header: "Users saved",
      content: `${counts
        .map(
          ({ change, count }) =>
            `${count} ${STATUS[change].label.toLowerCase()}`,
        )
        .join(", ")} for ${entry.application.title}.`,
    });
    onClose();
  };

  const renderDetail = (user: UserSummary) => {
    const change = changeOf(user.userId);
    const groups = entry.groups.filter((group) =>
      memberships.get(user.userId)?.has(group.groupId),
    );
    return (
      <>
        <span className={`${classBase}-pickerGroups`}>
          {groups.map((group) => (
            <Tag bordered key={group.groupId}>
              {groupDisplayName(group.groupName, prefix)}
            </Tag>
          ))}
        </span>
        {change !== "unchanged" ? (
          <Tag
            category={STATUS[change].category}
            className={`${classBase}-pickerStatus`}
          >
            {STATUS[change].label}
          </Tag>
        ) : null}
      </>
    );
  };

  const single = selected.size === 1 ? [...selected.values()][0] : undefined;
  const none = selected.size === 0;

  return (
    <>
      <DialogHeader
        description="Select a user to see and change their groups. Shift or Ctrl/Cmd-click to change several users at once. Changes are kept until you save."
        header={
          <span className={`${classBase}-dialogTitle`}>
            <AppAvatar application={entry.application} size={1.25} />
            Manage users of {entry.application.title}
          </span>
        }
      />
      <DialogContent>
        <div className={`${classBase}-grant`}>
          <section aria-label="Users" className={`${classBase}-grantColumn`}>
            <Text styleAs="label">
              <strong>1 · Users</strong>{" "}
              {selected.size > 1 ? <Tag>{selected.size} selected</Tag> : null}
            </Text>
            <ToggleButtonGroup
              aria-label="Show users"
              onChange={(event) =>
                setAccess(event.currentTarget.value as UserAccessFilter)
              }
              value={access}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="with">With access</ToggleButton>
              <ToggleButton value="without">Without access</ToggleButton>
            </ToggleButtonGroup>
            <UserPicker
              accessRole={entry.application.accessRole}
              aria-label="Users"
              access={access}
              onChange={setSelected}
              renderDetail={renderDetail}
              selected={selected}
              selectionMode="extended"
            />
          </section>
          <section aria-label="Groups" className={`${classBase}-grantColumn`}>
            <span className={`${classBase}-grantHeading`}>
              <Text styleAs="label">
                <strong>2 · Groups</strong>
              </Text>
              {selectedHasChanges ? (
                <Button
                  appearance="transparent"
                  disabled={saving}
                  onClick={undoSelected}
                >
                  Undo changes
                </Button>
              ) : null}
            </span>
            <Text color="secondary" styleAs="label">
              {none
                ? "Select a user to see their groups."
                : single
                  ? `Groups ${userName(single)} is in.`
                  : `Groups of ${selected.size} users. A dash means only some are in it. Clicking a group puts them all in it; their other groups are left as they are.`}
            </Text>
            {accessGroups(entry).length === 0 ? (
              <p role="alert">
                {entry.application.title} has no group that grants access.
                Create one on the Groups &amp; roles tab first.
              </p>
            ) : null}
            {entry.groups.map((group) => {
              const { count = 0, state = "unchecked" } =
                selection.get(group.groupId) ?? {};
              return (
                <div
                  className={`${classBase}-option${state !== "unchecked" ? ` ${classBase}-optionSelected` : ""}`}
                  key={group.groupId}
                >
                  <Checkbox
                    checked={state === "checked"}
                    disabled={saving || none}
                    indeterminate={state === "mixed"}
                    label={
                      <span className="vuuAdminUi-stack">
                        <GroupName name={group.groupName} prefix={prefix} />
                        <Text color="secondary" styleAs="label">
                          {[
                            group.description,
                            plural(group.userCount, "member"),
                            state === "mixed"
                              ? `${count} of ${selected.size} selected`
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      </span>
                    }
                    onChange={() => toggleGroup(group.groupId)}
                  />
                  <span className="vuuAdminUi-tags">
                    {group.hasAccessRole ? (
                      <AccessTag />
                    ) : (
                      <Tag category={7}>No access role</Tag>
                    )}
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
          {counts.length > 0 ? (
            counts.map(({ change, count }) => (
              <Tag category={STATUS[change].category} key={change}>
                {count} {STATUS[change].label.toLowerCase()}
              </Tag>
            ))
          ) : (
            <Text color="secondary">No changes yet.</Text>
          )}
        </span>
        <Button disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={saving || operations.length === 0}
          onClick={() => void save()}
          sentiment="accented"
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={onClose} />
    </>
  );
};

/** Adds users to the application or changes the groups of existing ones. */
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
