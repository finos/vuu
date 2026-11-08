import {
  Avatar,
  Banner,
  BannerContent,
  Button,
  Checkbox,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  Option,
  Table as SaltTable,
  TBody,
  TD,
  Text,
  TH,
  THead,
  TR,
  Tag,
} from "@salt-ds/core";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  UserGroupIcon,
} from "@salt-ds/icons";
import { useModal } from "@vuu-ui/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { plural, StatusText } from "../../components/admin-ui/AdminUi";
import {
  addToGroupsOperations,
  groupLabel,
  type Memberships,
  moveToGroupOperations,
  removeFromGroupOperations,
  revokeAccessOperations,
  roleLabel,
  rolesGrantedBy,
} from "../../data/admin-plans";
import {
  type AdminOperation,
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type {
  ApplicationDetails,
  ApplicationGroup,
} from "../../data/applications";
import { useAdminPaths } from "../../data/useAdminPaths";
import {
  type UserSummary,
  useApplicationUserList,
  userName,
} from "../../data/useApplicationUsers";

const classBase = "vuuAdminApplication";
const ALL_GROUPS = "__all__";

const GroupMenu = ({
  disabled,
  groups,
  label,
  onSelect,
  entry,
}: {
  disabled: boolean;
  entry: ApplicationDetails;
  groups: readonly ApplicationGroup[];
  label: string;
  onSelect: (group: ApplicationGroup) => void;
}) => (
  <Menu>
    <MenuTrigger>
      <Button disabled={disabled || groups.length === 0}>
        {label} <ChevronDownIcon aria-hidden />
      </Button>
    </MenuTrigger>
    <MenuPanel>
      {groups.map((group) => (
        <MenuItem key={group.groupId} onClick={() => onSelect(group)}>
          {groupLabel(entry, group)}
        </MenuItem>
      ))}
    </MenuPanel>
  </Menu>
);

export interface ApplicationUsersTabProps {
  entry: ApplicationDetails;
  memberships: Memberships;
  membershipsError?: string;
  /** Opens the dialog that gives users access. */
  onManageUsers: () => void;
}

/** Everyone who can open the application, with batch changes to their groups. */
export const ApplicationUsersTab = ({
  entry,
  memberships,
  membershipsError,
  onManageUsers,
}: ApplicationUsersTabProps) => {
  const rpc = useAdminRpc();
  const paths = useAdminPaths();
  const { showNotification } = useNotifications();
  const { closePrompt, showPrompt } = useModal();
  const { error, loading, users } = useApplicationUserList(entry);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);
  const filterGroup = entry.groups.find(
    ({ groupId }) => groupId === groupFilter,
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return users.filter(
      (user) =>
        (groupFilter === ALL_GROUPS ||
          memberships.get(user.userId)?.has(groupFilter)) &&
        (!needle ||
          [user.username, user.email, user.firstName, user.lastName].some(
            (value) => value.toLocaleLowerCase().includes(needle),
          )),
    );
  }, [groupFilter, memberships, search, users]);

  const selected = useMemo(
    () => users.filter((user) => selectedIds.has(user.userId)),
    [selectedIds, users],
  );
  const allVisibleSelected =
    visible.length > 0 && visible.every((user) => selectedIds.has(user.userId));

  const run = useCallback(
    async (operations: AdminOperation[], success: string) => {
      if (operations.length === 0) {
        showNotification({
          type: "toast",
          status: "info",
          header: "Nothing to change",
          content: "The selected users are already set up that way.",
        });
        return;
      }
      setSaving(true);
      const result = await runOperations(rpc, operations);
      setSaving(false);
      if (result.failed) {
        showNotification({
          type: "toast",
          status: "error",
          header: "Some changes were not saved",
          content: describeFailure(result),
        });
      } else {
        setSelectedIds(new Set());
        showNotification({
          type: "toast",
          status: "success",
          header: "Users updated",
          content: success,
        });
      }
    },
    [rpc, showNotification],
  );

  const who = plural(selected.length, "user");

  const revoke = () =>
    showPrompt(
      <p>
        Remove {who} from every {entry.application.title} group? They will no
        longer be able to open {entry.application.title}.
      </p>,
      {
        cancelButtonLabel: "Cancel",
        confirmButtonLabel: "Revoke access",
        onCancel: closePrompt,
        onClose: closePrompt,
        onConfirm: () => {
          closePrompt();
          void run(
            revokeAccessOperations(entry, selected, memberships),
            `${who} can no longer open ${entry.application.title}.`,
          );
        },
        title: "Revoke access",
      },
    );

  const toggleUser = (user: UserSummary, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(user.userId);
    else next.delete(user.userId);
    setSelectedIds(next);
  };

  return (
    <div className={`${classBase}-tab`}>
      {error || membershipsError ? (
        <Banner status="error">
          <BannerContent role="alert">
            {error ?? membershipsError}
          </BannerContent>
        </Banner>
      ) : null}
      <div className="vuuIdentityAdmin-toolbar">
        <Input
          bordered
          className={`${classBase}-filter`}
          inputProps={{ "aria-label": "Filter users" }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearch(event.target.value)
          }
          placeholder="Filter by name, username or email"
          startAdornment={<SearchIcon aria-hidden />}
          value={search}
        />
        <Dropdown<string>
          aria-label="Group"
          bordered
          className={`${classBase}-groupFilter`}
          onSelectionChange={(_event: SyntheticEvent, [value]) =>
            setGroupFilter(value ?? ALL_GROUPS)
          }
          value={filterGroup ? groupLabel(entry, filterGroup) : "All groups"}
        >
          <Option value={ALL_GROUPS}>All groups</Option>
          {entry.groups.map((group) => (
            <Option key={group.groupId} value={group.groupId}>
              {groupLabel(entry, group)}
            </Option>
          ))}
        </Dropdown>
        <Text
          aria-live="polite"
          className="vuuIdentityAdmin-count"
          color="secondary"
        >
          {loading
            ? "Loading users..."
            : `${plural(users.length, "user")} with access`}
        </Text>
        <Button
          className={`${classBase}-manageUsers`}
          onClick={onManageUsers}
          sentiment="accented"
        >
          <UserGroupIcon aria-hidden /> Manage users
        </Button>
      </div>

      {selected.length > 0 ? (
        <div
          aria-label="Selected users"
          className={`${classBase}-batchBar`}
          role="toolbar"
        >
          <strong>{who} selected</strong>
          <GroupMenu
            disabled={saving}
            entry={entry}
            groups={entry.groups}
            label="Add to group"
            onSelect={(group) =>
              void run(
                addToGroupsOperations(selected, [group], memberships),
                `${who} added to ${groupLabel(entry, group)}.`,
              )
            }
          />
          <GroupMenu
            disabled={saving}
            entry={entry}
            groups={entry.groups}
            label="Move to group"
            onSelect={(group) =>
              void run(
                moveToGroupOperations(entry, selected, group, memberships),
                `${who} moved to ${groupLabel(entry, group)}.`,
              )
            }
          />
          <GroupMenu
            disabled={saving}
            entry={entry}
            groups={entry.groups}
            label="Remove from group"
            onSelect={(group) =>
              void run(
                removeFromGroupOperations(selected, group, memberships),
                `${who} removed from ${groupLabel(entry, group)}.`,
              )
            }
          />
          <Button disabled={saving} onClick={revoke}>
            Revoke access
          </Button>
          <Button
            appearance="transparent"
            className={`${classBase}-batchClear`}
            disabled={saving}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      <div className={`${classBase}-usersScroll`}>
        <SaltTable
          aria-label={`${entry.application.title} users`}
          className={`${classBase}-users`}
          divider="tertiary"
        >
          <THead>
            <TR>
              <TH className={`${classBase}-selectColumn`}>
                <Checkbox
                  aria-label="Select all shown users"
                  checked={allVisibleSelected}
                  disabled={visible.length === 0}
                  indeterminate={
                    !allVisibleSelected &&
                    visible.some((user) => selectedIds.has(user.userId))
                  }
                  onChange={(event) => {
                    const next = new Set(selectedIds);
                    for (const user of visible) {
                      if (event.target.checked) next.add(user.userId);
                      else next.delete(user.userId);
                    }
                    setSelectedIds(next);
                  }}
                />
              </TH>
              <TH>User</TH>
              <TH>Groups</TH>
              <TH>Roles granted</TH>
              <TH>Status</TH>
              <TH>
                <span className="vuuAdminUi-visuallyHidden">Open</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {visible.map((user) => {
              const groupIds =
                memberships.get(user.userId) ?? new Set<string>();
              const groups = entry.groups.filter(({ groupId }) =>
                groupIds.has(groupId),
              );
              const roles = rolesGrantedBy(entry, groupIds);
              const isSelected = selectedIds.has(user.userId);
              return (
                <TR
                  className={
                    isSelected ? `${classBase}-rowSelected` : undefined
                  }
                  key={user.userId}
                >
                  <TD>
                    <Checkbox
                      aria-label={`Select ${userName(user)}`}
                      checked={isSelected}
                      onChange={(event) =>
                        toggleUser(user, event.target.checked)
                      }
                    />
                  </TD>
                  <TD>
                    <span className="vuuIdentityAdmin-cell">
                      <Avatar aria-hidden name={userName(user)} size={1} />
                      <span className="vuuAdminUi-stack">
                        <strong>{userName(user)}</strong>
                        <Text color="secondary" styleAs="label">
                          {[user.username, user.email]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      </span>
                    </span>
                  </TD>
                  <TD>
                    <span className="vuuAdminUi-tags">
                      {groups.map((group) => (
                        <Tag key={group.groupId}>
                          {groupLabel(entry, group)}
                        </Tag>
                      ))}
                    </span>
                  </TD>
                  <TD>
                    <Text color="secondary">
                      {[
                        "access",
                        ...roles.map((role) => roleLabel(entry, role)),
                      ].join(", ")}
                    </Text>
                  </TD>
                  <TD>
                    {user.enabled ? (
                      <StatusText status="success">Enabled</StatusText>
                    ) : (
                      <StatusText status="error">Disabled</StatusText>
                    )}
                  </TD>
                  <TD>
                    <Link
                      aria-label={`Open ${userName(user)}`}
                      className={`${classBase}-open`}
                      to={paths.user(user.userId)}
                    >
                      <ChevronRightIcon aria-hidden />
                    </Link>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </SaltTable>
        {!loading && visible.length === 0 ? (
          <p className="vuuIdentityAdmin-empty">
            {users.length === 0
              ? `No one can open ${entry.application.title} yet. Use Manage users to give people access.`
              : "No users match the filter."}
          </p>
        ) : null}
      </div>
    </div>
  );
};
