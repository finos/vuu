import {
  DataEditingProvider,
  EditButtons,
  EditField,
  useEditable,
  useEditMode,
  type EditLifecycle,
} from "@vuu-ui/vuu-data-editing";
import {
  Button,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  ListBox,
  Option,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
} from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { type ItemDescriptor, ItemPicker } from "@vuu-ui/vuu-ui-controls";
import { filterAsQuery, isRpcError } from "@vuu-ui/vuu-utils";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import { errorMessage } from "../../data/admin-contract";
import {
  type ApplicationDetails,
  type ApplicationModel,
  type ApplicationRole,
  applicationForGroupName,
  groupNameFromPath,
} from "../../data/applications";
import { useApplicationModel } from "../../data/useApplicationModel";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import { useLookupRows } from "../../data/useLookupRows";

import "./GroupsEditForm.css";

const classBase = "vuuGroupsEditForm";
const newGroupRow = { key: "__vuu_new_row__" } as DataRow;
const GROUP_NAME_COLUMN = "group_name";
const ROLE_ASSIGNMENTS_COLUMN = "role_assignments";
const groupRoleColumns = ["assignment_id", "group_id", "role_id"];
// Keycloak group names are path segments.
const INVALID_GROUP_SUFFIX = /[\s/]/;

type GroupRoleItem = ItemDescriptor;

const roleItemFor = (
  model: ApplicationModel,
  role: ApplicationRole,
): GroupRoleItem => {
  const application = model.byName.get(
    model.roleApplication.get(role.roleId) ?? "",
  )?.application;
  return {
    label: application
      ? `${role.roleName} (${application.title})`
      : role.clientIdentifier
        ? `${role.roleName} (${role.clientIdentifier})`
        : role.roleName,
    name: role.roleId,
  };
};

/**
 * Roles an administrator may choose for a group. For an application group
 * these are the application's own roles; the access role is always included
 * separately. Roles already assigned from elsewhere stay listed so they can be
 * removed. Groups matching no application may use any role.
 */
const assignableRoleItems = (
  model: ApplicationModel,
  entry: ApplicationDetails | undefined,
  assignedRoleIds: readonly string[] = [],
) => {
  const accessRoleId = entry?.accessRole?.roleId;
  const roles = entry
    ? [
        ...entry.roles,
        ...assignedRoleIds.flatMap((roleId) => {
          const role = model.rolesById.get(roleId);
          return role && roleId !== accessRoleId && !entry.roles.includes(role)
            ? [role]
            : [];
        }),
      ]
    : [...model.rolesById.values()];
  return roles.map((role) => roleItemFor(model, role));
};

const roleAssignmentsValue = (
  entry: ApplicationDetails | undefined,
  items: readonly GroupRoleItem[],
) =>
  JSON.stringify([
    ...(entry?.accessRole ? [entry.accessRole.roleId] : []),
    ...items.map(({ name }) => name),
  ]);

const AccessRoleNote = ({
  entry,
  included,
}: {
  entry: ApplicationDetails;
  included: boolean;
}) => {
  const { accessRole, application } = entry;
  if (!accessRole) {
    return (
      <p role="alert">
        Access role "{application.accessRole}" was not found on the vuu-portal
        client. Members of this group cannot open {application.title}.
      </p>
    );
  }
  return included ? (
    <p role="note" className={`${classBase}-accessRole`}>
      Includes access role <strong>{accessRole.roleName}</strong>, which lets
      members open {application.title}.
    </p>
  ) : (
    <p role="alert">
      This group does not include access role {accessRole.roleName}, so its
      members cannot open {application.title}.
    </p>
  );
};

const SelectedRoles = ({ items }: { items: GroupRoleItem[] }) => (
  <ListBox aria-label="Assigned roles" bordered readOnly selected={[]}>
    {items.map((item) => (
      <Option key={item.name} value={item}>
        {item.label ?? item.name}
      </Option>
    ))}
  </ListBox>
);

export interface GroupsEditFormProps {
  /** Application to preselect when creating a group. */
  application?: string;
  dataRow: DataRow;
  dataSource: DataSource;
  onClose?: () => void;
}

const CreateGroupForm = ({
  application: defaultApplication,
  dataSource,
  onClose,
}: GroupsEditFormProps) => {
  const { setEditMode } = useEditMode();
  const { showNotification } = useNotifications();
  const noOp = useCallback(() => undefined, []);
  const { editSession } = useEditable({
    copyOption: "Empty",
    dataSource,
    onCancel: noOp,
    onSave: noOp,
  });
  const { error: modelError, loading, model } = useApplicationModel();
  const [applicationName, setApplicationName] = useState(
    defaultApplication ?? "",
  );
  const entry = model.byName.get(applicationName);
  const [suffix, setSuffix] = useState("");
  const [selectedItems, setSelectedItems] = useState<GroupRoleItem[]>([]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [sessionActive, setSessionActive] = useState(
    editSession.lifecycle.status === "active",
  );
  const [rowStaged, setRowStaged] = useState(false);
  const savingRef = useRef(false);
  const allRoleItems = useMemo(
    () => (entry ? assignableRoleItems(model, entry) : []),
    [entry, model],
  );

  useEffect(() => {
    editSession.configureNewRow(
      [GROUP_NAME_COLUMN, ROLE_ASSIGNMENTS_COLUMN],
      [GROUP_NAME_COLUMN],
    );
    const onLifecycle = (lifecycle: EditLifecycle) => {
      setSessionActive(
        lifecycle.status === "active" ||
          (lifecycle.status === "error" && lifecycle.operation === "end"),
      );
      if (lifecycle.status === "error") setError(lifecycle.error.message);
    };
    const onDraftChange = () => setError(undefined);
    editSession.on("lifecycle", onLifecycle);
    editSession.on("newRow", onDraftChange);
    onLifecycle(editSession.lifecycle);
    return () => {
      editSession.removeListener("lifecycle", onLifecycle);
      editSession.removeListener("newRow", onDraftChange);
    };
  }, [editSession]);

  const close = useCallback(() => {
    setEditMode(false);
    onClose?.();
  }, [onClose, setEditMode]);

  const onApplicationSelectionChange = useCallback(
    (_event: SyntheticEvent, [selected]: ApplicationDetails[]) => {
      if (!selected) return;
      setApplicationName(selected.application.name);
      setSelectedItems([]);
      setError(undefined);
    },
    [],
  );

  const onSuffixChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSuffix(event.target.value);
    setError(undefined);
  }, []);

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      const byName = new Map(allRoleItems.map((item) => [item.name, item]));
      setSelectedItems(
        items.flatMap((item) => {
          const role = byName.get(item.name);
          return role ? [role] : [];
        }),
      );
    },
    [allRoleItems],
  );

  const closeSession = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await editSession.end(false);
      close();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [close, editSession]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (savingRef.current || rowStaged) return;
      if (!sessionActive) {
        setError("The group edit session is not ready yet.");
        return;
      }
      if (!entry) {
        setError("Application is required.");
        return;
      }
      if (!entry.accessRole) {
        setError(
          `Access role "${entry.application.accessRole}" was not found, so a ${entry.application.title} group would not grant access.`,
        );
        return;
      }
      const trimmedSuffix = suffix.trim();
      if (!trimmedSuffix) {
        setError("Group name is required.");
        return;
      }
      if (INVALID_GROUP_SUFFIX.test(trimmedSuffix)) {
        setError("Group names cannot contain spaces or slashes.");
        return;
      }
      const groupName = `${entry.application.groupPrefix}${trimmedSuffix}`;
      if (
        [...model.groupsById.values()].some(
          (group) => group.groupName === groupName,
        )
      ) {
        setError(`A group named "${groupName}" already exists.`);
        return;
      }

      savingRef.current = true;
      setSaving(true);
      setError(undefined);
      let shouldClose = false;
      try {
        editSession.setNewRowValue(GROUP_NAME_COLUMN, groupName);
        editSession.setNewRowValue(
          ROLE_ASSIGNMENTS_COLUMN,
          roleAssignmentsValue(entry, selectedItems),
        );
        const result = await editSession.addNewRow();
        if (isRpcError(result)) throw new Error(result.errorMessage);
        if (Object.keys(editSession.newRowState.errors).length > 0) {
          throw new Error("Complete the required group fields before saving.");
        }
        setRowStaged(true);
        await editSession.end(true);
        showNotification({
          type: "toast",
          status: "success",
          header: "Group created",
          content: `${groupName} was created. Add users to it to give them access to ${entry.application.title}.`,
        });
        shouldClose = true;
      } catch (cause) {
        const message = errorMessage(cause);
        setError(message);
        showNotification({
          type: "toast",
          status: "error",
          header: "Group creation failed",
          content: message,
          dismissal: "manual",
        });
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      if (shouldClose) close();
    },
    [
      close,
      editSession,
      entry,
      model,
      rowStaged,
      selectedItems,
      sessionActive,
      showNotification,
      suffix,
    ],
  );

  const locked = !sessionActive || saving || rowStaged;

  return (
    <DataEditingProvider editSession={editSession}>
      <form className={classBase} onSubmit={onSubmit}>
        {error ? <p role="alert">{error}</p> : null}
        {modelError ? <p role="alert">{modelError}</p> : null}
        {!sessionActive && !error ? (
          <p role="status">Starting edit session...</p>
        ) : null}
        {saving ? <p role="status">Saving group...</p> : null}
        <Tabs defaultValue="GroupDetails">
          <TabBar inset divider>
            <TabList appearance="bordered">
              <Tab value="GroupDetails">
                <TabTrigger>Group Details</TabTrigger>
              </Tab>
              <Tab value="Roles">
                <TabTrigger>Roles</TabTrigger>
              </Tab>
            </TabList>
          </TabBar>
          <TabPanel value="GroupDetails">
            <fieldset disabled={locked}>
              <FormField necessity="asterisk">
                <FormFieldLabel>Application</FormFieldLabel>
                <Dropdown<ApplicationDetails>
                  aria-label="Application"
                  data-icon="triangle-down"
                  onSelectionChange={onApplicationSelectionChange}
                  placeholder="Please select value"
                  value={entry?.application.title ?? ""}
                >
                  {model.applications.map((candidate) => (
                    <Option key={candidate.application.name} value={candidate}>
                      {candidate.application.title}
                    </Option>
                  ))}
                </Dropdown>
                <FormFieldHelperText>
                  {loading
                    ? "Loading applications..."
                    : "Members of the group will be able to open this application."}
                </FormFieldHelperText>
              </FormField>
              <FormField necessity="asterisk">
                <FormFieldLabel>Group name</FormFieldLabel>
                <Input
                  disabled={!entry}
                  inputProps={{ "aria-label": "Group name" }}
                  onChange={onSuffixChange}
                  startAdornment={
                    entry ? (
                      <span className={`${classBase}-prefix`}>
                        {entry.application.groupPrefix}
                      </span>
                    ) : undefined
                  }
                  value={suffix}
                />
                <FormFieldHelperText>
                  {entry
                    ? `The ${entry.application.groupPrefix} prefix links the group to ${entry.application.title}.`
                    : "Choose an application first."}
                </FormFieldHelperText>
              </FormField>
            </fieldset>
          </TabPanel>
          <TabPanel value="Roles">
            {!entry ? (
              <p role="status">Choose an application to see its roles.</p>
            ) : (
              <>
                <AccessRoleNote entry={entry} included />
                {locked ? (
                  <SelectedRoles items={selectedItems} />
                ) : allRoleItems.length === 0 ? (
                  <p role="status">
                    {entry.application.title} has no roles of its own yet.
                  </p>
                ) : (
                  <ItemPicker
                    allItems={allRoleItems}
                    aria-label="Group roles"
                    itemTypeName="role"
                    onSelectedItemsChange={onSelectedItemsChange}
                    selectedItems={selectedItems}
                    style={{ height: 360 }}
                  />
                )}
              </>
            )}
          </TabPanel>
        </Tabs>
        <div className="vuuIdentityAdmin-formActions">
          <Button type="submit" disabled={locked}>
            Save
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void closeSession()}
          >
            {rowStaged ? "Close" : "Cancel"}
          </Button>
        </div>
      </form>
    </DataEditingProvider>
  );
};

const EditGroupForm = ({ dataRow, dataSource }: GroupsEditFormProps) => {
  const { isEditMode, setEditMode } = useEditMode();
  const { error: modelError, loading, model } = useApplicationModel();
  const groupId = typeof dataRow.group_id === "string" ? dataRow.group_id : "";
  const groupName = groupNameFromPath(dataRow.group_path) ?? "";
  const entry = useMemo(() => {
    const application = applicationForGroupName(
      model.applications.map(({ application }) => application),
      groupName,
    );
    return application ? model.byName.get(application.name) : undefined;
  }, [groupName, model]);
  const accessRoleId = entry?.accessRole?.roleId;
  const roleFilter = useMemo(
    () =>
      groupId && !/["\\\t\r\n]/.test(groupId)
        ? filterAsQuery({ op: "=", column: "group_id", value: groupId })
        : undefined,
    [groupId],
  );
  const assignedRoles = useLookupRows(
    USER_ADMIN_TABLES.groupRoles,
    groupRoleColumns,
    !!groupId && !!roleFilter,
    roleFilter,
  );
  const assignedRoleIds = useMemo(
    () =>
      assignedRoles.rows.flatMap((row) =>
        row.group_id === groupId && typeof row.role_id === "string"
          ? [row.role_id]
          : [],
      ),
    [assignedRoles.rows, groupId],
  );
  const [selectedItems, setSelectedItems] = useState<GroupRoleItem[]>([]);
  const [staging, setStaging] = useState(false);
  const [accessRoleStaged, setAccessRoleStaged] = useState(false);
  const [error, setError] = useState<string>();
  const originalRoleIds = useRef<string[] | undefined>(undefined);
  const originalRoleItems = useRef<GroupRoleItem[]>([]);
  const handleSaveSuccess = useCallback(() => {
    originalRoleIds.current = JSON.parse(
      roleAssignmentsValue(entry, selectedItems),
    );
    originalRoleItems.current = selectedItems;
    setEditMode(false);
  }, [entry, selectedItems, setEditMode]);
  const {
    editSession,
    onCancel: cancelEdit,
    onSave,
  } = useEditable({
    dataSource,
    onCancel: () => setEditMode(false),
    onSave: handleSaveSuccess,
  });
  const { showNotification } = useNotifications();
  const [sessionActive, setSessionActive] = useState(
    editSession.lifecycle.status === "active",
  );
  const allRoleItems = useMemo(
    () => assignableRoleItems(model, entry, assignedRoleIds),
    [assignedRoleIds, entry, model],
  );

  useEffect(() => {
    if (loading || assignedRoles.loading || !groupId) return;
    // Live updates must not discard roles staged in the current edit.
    if (isEditMode && originalRoleIds.current) return;
    const roleItemsById = new Map(
      allRoleItems.map((item) => [item.name, item]),
    );
    const assignedItems = assignedRoleIds.flatMap((roleId) => {
      if (roleId === accessRoleId) return [];
      const item = roleItemsById.get(roleId);
      return [item ?? { name: roleId }];
    });
    originalRoleIds.current = assignedRoleIds;
    originalRoleItems.current = assignedItems;
    setSelectedItems(assignedItems);
    setAccessRoleStaged(false);
  }, [
    accessRoleId,
    allRoleItems,
    assignedRoleIds,
    assignedRoles.loading,
    groupId,
    isEditMode,
    loading,
  ]);

  useEffect(() => {
    const onLifecycle = (lifecycle: EditLifecycle) => {
      setSessionActive(
        lifecycle.status === "active" ||
          (lifecycle.status === "error" && lifecycle.operation === "end"),
      );
      if (lifecycle.status === "error") setError(lifecycle.error.message);
    };
    editSession.on("lifecycle", onLifecycle);
    onLifecycle(editSession.lifecycle);
    return () => editSession.removeListener("lifecycle", onLifecycle);
  }, [editSession]);

  const onToggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  const stageRoles = useCallback(
    (nextItems: GroupRoleItem[]) => {
      const original = originalRoleIds.current;
      if (!original) return;
      // Application groups always keep their access role.
      const value = roleAssignmentsValue(entry, nextItems);
      setStaging(true);
      void editSession
        .commit(
          dataRow.key,
          ROLE_ASSIGNMENTS_COLUMN,
          JSON.stringify(original),
          value,
          true,
          { dataSourceValue: value },
        )
        .then(() => {
          setSelectedItems(nextItems);
          setAccessRoleStaged(!!entry?.accessRole);
          setError(undefined);
        })
        .catch((cause: unknown) => {
          setError(errorMessage(cause));
          showNotification({
            type: "toast",
            status: "error",
            header: "Unable to stage group roles",
            content: errorMessage(cause),
          });
        })
        .finally(() => setStaging(false));
    },
    [dataRow.key, editSession, entry, showNotification],
  );

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      if (!isEditMode) return;
      const byName = new Map(allRoleItems.map((item) => [item.name, item]));
      stageRoles(
        items.flatMap((item) => {
          const role = byName.get(item.name);
          return role ? [role] : [];
        }),
      );
    },
    [allRoleItems, isEditMode, stageRoles],
  );

  const onCancel = useCallback(() => {
    setSelectedItems(originalRoleItems.current);
    setAccessRoleStaged(false);
    setError(undefined);
    cancelEdit();
  }, [cancelEdit]);

  const lookupError =
    modelError ??
    assignedRoles.error ??
    (!groupId
      ? "Backend contract unavailable: this group is missing its group ID."
      : !roleFilter
        ? "This group has an ID that cannot be safely used in an assignment query."
        : undefined);
  const canStage = isEditMode && sessionActive && !staging && !lookupError;
  const hasAccessRole =
    accessRoleStaged ||
    (!!accessRoleId && assignedRoleIds.includes(accessRoleId));

  return (
    <DataEditingProvider editSession={editSession}>
      <Toolbar>
        <ToggleButtonGroup
          onChange={onToggleEditMode}
          value={isEditMode ? "edit" : "view"}
        >
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>
      {error ? <p role="alert">{error}</p> : null}
      <form className={classBase}>
        <Tabs defaultValue="GroupDetails">
          <TabBar inset divider>
            <TabList appearance="bordered">
              <Tab value="GroupDetails">
                <TabTrigger>Group Details</TabTrigger>
              </Tab>
              <Tab value="Roles">
                <TabTrigger>Roles</TabTrigger>
              </Tab>
            </TabList>
          </TabBar>
          <TabPanel value="GroupDetails">
            <dl className="vuuIdentityAdmin-details">
              <div>
                <dt>Application</dt>
                <dd>{entry ? entry.application.title : "Unassigned"}</dd>
              </div>
            </dl>
            {!entry && !loading ? (
              <p role="note">
                This group's name does not start with any application's group
                prefix, so it does not grant access to an application.
              </p>
            ) : null}
            <EditField
              dataRow={dataRow}
              label="Display name"
              name="group_display_name"
              readOnly
            />
            <EditField
              dataRow={dataRow}
              label="Group path"
              name="group_path"
              readOnly
            />
            <EditField
              dataRow={dataRow}
              label="Users"
              name="user_count"
              readOnly
            />
            <EditField
              dataRow={dataRow}
              label="Roles"
              name="role_count"
              readOnly
            />
          </TabPanel>
          <TabPanel value="Roles">
            {lookupError ? <p role="alert">{lookupError}</p> : null}
            {loading || assignedRoles.loading ? (
              <p role="status">Loading group roles...</p>
            ) : (
              <>
                {entry ? (
                  <>
                    <AccessRoleNote entry={entry} included={hasAccessRole} />
                    {entry.accessRole && !hasAccessRole && canStage ? (
                      <Button
                        type="button"
                        onClick={() => stageRoles(selectedItems)}
                      >
                        Add access role
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {!canStage ? (
                  <SelectedRoles items={selectedItems} />
                ) : (
                  <ItemPicker
                    allItems={allRoleItems}
                    aria-label="Group roles"
                    itemTypeName="role"
                    onSelectedItemsChange={onSelectedItemsChange}
                    selectedItems={selectedItems}
                    style={{ height: 360 }}
                  />
                )}
              </>
            )}
          </TabPanel>
        </Tabs>
      </form>
      <EditButtons
        canCancel={sessionActive && !staging && editSession.canCancel}
        canSave={sessionActive && !staging && editSession.canSave}
        editSession={editSession}
        onCancel={onCancel}
        onSave={onSave}
      />
    </DataEditingProvider>
  );
};

export const GroupsEditForm = (props: GroupsEditFormProps) =>
  props.dataRow.group_id === undefined ? (
    <CreateGroupForm {...props} dataRow={newGroupRow} />
  ) : (
    <EditGroupForm {...props} />
  );
