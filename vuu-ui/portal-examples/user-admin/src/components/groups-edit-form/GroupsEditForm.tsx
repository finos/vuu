import {
  DataEditingProvider,
  EditButtons,
  EditField,
  useEditable,
  useEditMode,
  type EditLifecycle,
} from "@vuu-ui/vuu-data-editing";
import { useData } from "@vuu-ui/core";
import {
  Button,
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
import type {
  DataSourceSubscribeCallback,
  SchemaColumn,
} from "@vuu-ui/vuu-data-types";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import {
  type DataRowFunc,
  dataRowFactory,
} from "@vuu-ui/vuu-table";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  type ItemDescriptor,
  ItemPicker,
} from "@vuu-ui/vuu-ui-controls";
import { filterAsQuery, isRpcError, Range } from "@vuu-ui/vuu-utils";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { errorMessage } from "../../data/admin-contract";

import "./GroupsEditForm.css";

const classBase = "vuuGroupsEditForm";
const newGroupRow = { key: "__vuu_new_row__" } as DataRow;
const GROUP_NAME_COLUMN = "group_name";
const ROLE_ASSIGNMENTS_COLUMN = "role_assignments";
const rolesTable = { module: "USER_ADMIN", table: "roles" };
const groupRolesTable = { module: "USER_ADMIN", table: "group_roles" };
const roleColumns = [
  "role_id",
  "role_name",
  "role_display_name",
  "client_id",
  "client_identifier",
  "client_name",
];
const groupRoleColumns = [
  "group_id",
  "role_id",
  "role_name",
  "role_display_name",
  "client_identifier",
];

interface LookupRows {
  error?: string;
  loading: boolean;
  rows: DataRow[];
}

const useLookupRows = (
  table: typeof rolesTable | typeof groupRolesTable,
  columns: string[],
  enabled: boolean,
  filter?: string,
): LookupRows => {
  const { VuuDataSource } = useData();
  const [resource, setResource] = useState<LookupRows>({
    loading: enabled,
    rows: [],
  });
  const dataSource = useMemo(
    () =>
      enabled
        ? new VuuDataSource({
            bufferSize: 1000,
            columns,
            filterSpec: filter ? { filter } : undefined,
            table,
          })
        : undefined,
    [VuuDataSource, columns, enabled, filter, table],
  );

  useEffect(() => {
    setResource({ loading: !!dataSource, rows: [] });
    if (!dataSource) return;

    let active = true;
    let makeDataRow: DataRowFunc | undefined;
    const subscribe: DataSourceSubscribeCallback = (message) => {
      if (!active) return;
      if (message.type === "subscribed") {
        const missing = columns.filter(
          (column) =>
            !message.columns.includes(column) ||
            !message.tableSchema.columns.some(
              (schemaColumn) => schemaColumn.name === column,
            ),
        );
        if (missing.length > 0) {
          setResource({
            error: `Backend contract unavailable: ${table.table} is missing ${missing.join(", ")}.`,
            loading: false,
            rows: [],
          });
          return;
        }
        [makeDataRow] = dataRowFactory(
          message.columns,
          message.tableSchema.columns as readonly SchemaColumn[],
        );
      } else if (message.type === "viewport-update") {
        if (!makeDataRow) {
          setResource({
            error: `The ${table.table} table sent rows before its column metadata.`,
            loading: false,
            rows: [],
          });
          return;
        }
        const rowFactory = makeDataRow;
        setResource({
          loading: false,
          rows: (message.rows ?? []).map((row) => rowFactory(row)),
        });
      } else if (message.type === "subscribe-failed") {
        setResource({
          error: message.msg,
          loading: false,
          rows: [],
        });
      }
    };

    void dataSource
      .subscribe({ range: Range(0, 1000) }, subscribe)
      .catch((cause: unknown) => {
        if (active) {
          setResource({
            error: errorMessage(cause),
            loading: false,
            rows: [],
          });
        }
      });

    return () => {
      active = false;
      dataSource.unsubscribe();
    };
  }, [columns, dataSource, table.table]);

  return resource;
};

type GroupRoleItem = ItemDescriptor;

const roleItemFor = (
  row: Record<string, unknown>,
): GroupRoleItem | undefined => {
  const roleId = row.role_id;
  const roleName = row.role_name;
  if (typeof roleId !== "string" || typeof roleName !== "string") {
    return undefined;
  }
  const clientName =
    typeof row.client_name === "string" ? row.client_name : undefined;
  return {
    label: clientName ? `${roleName} (${clientName})` : roleName,
    name: roleId,
  };
};

const roleItemsFromRows = (rows: DataRow[]) =>
  rows.flatMap((row) => {
    const item = roleItemFor(row);
    return item ? [item] : [];
  });

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
  dataRow: DataRow;
  dataSource: DataSource;
  onClose?: () => void;
}

const CreateGroupForm = ({ dataSource, onClose }: GroupsEditFormProps) => {
  const { setEditMode } = useEditMode();
  const { showNotification } = useNotifications();
  const noOp = useCallback(() => undefined, []);
  const { editSession } = useEditable({
    copyOption: "Empty",
    dataSource,
    onCancel: noOp,
    onSave: noOp,
  });
  const roles = useLookupRows(rolesTable, roleColumns, true);
  const [selectedItems, setSelectedItems] = useState<GroupRoleItem[]>([]);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [sessionActive, setSessionActive] = useState(
    editSession.lifecycle.status === "active",
  );
  const [rowStaged, setRowStaged] = useState(false);
  const savingRef = useRef(false);

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

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      const nextItems = items.flatMap((item) => {
        const role = roles.rows
          .map(roleItemFor)
          .find((candidate) => candidate?.name === item.name);
        return role ? [role] : [];
      });
      setSelectedItems(nextItems);
      editSession.setNewRowValue(
        ROLE_ASSIGNMENTS_COLUMN,
        JSON.stringify(nextItems.map(({ name }) => name)),
      );
    },
    [editSession, roles.rows],
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
      const draft = editSession.newRowState.values;
      const groupName =
        typeof draft[GROUP_NAME_COLUMN] === "string"
          ? draft[GROUP_NAME_COLUMN].trim()
          : "";
      if (!groupName) {
        setError("Group name is required.");
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
          JSON.stringify(selectedItems.map(({ name }) => name)),
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
          content: "The group was created successfully.",
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
      rowStaged,
      selectedItems,
      sessionActive,
      showNotification,
    ],
  );

  return (
    <DataEditingProvider editSession={editSession}>
      <form className={classBase} onSubmit={onSubmit}>
        {error ? <p role="alert">{error}</p> : null}
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
            <fieldset disabled={!sessionActive || saving || rowStaged}>
              <EditField
                dataRow={newGroupRow}
                deferNewRow
                label="Group name"
                name={GROUP_NAME_COLUMN}
                required
              />
            </fieldset>
          </TabPanel>
          <TabPanel value="Roles">
            {roles.error ? <p role="alert">{roles.error}</p> : null}
            {roles.loading ? (
              <p role="status">Loading available roles...</p>
            ) : !sessionActive || saving || rowStaged ? (
              <SelectedRoles items={selectedItems} />
            ) : (
              <ItemPicker
                allItems={roleItemsFromRows(roles.rows)}
                aria-label="Group roles"
                itemTypeName="role"
                onSelectedItemsChange={onSelectedItemsChange}
                selectedItems={selectedItems}
                style={{ height: 360 }}
              />
            )}
          </TabPanel>
        </Tabs>
        <div className="vuuIdentityAdmin-formActions">
          <Button type="submit" disabled={!sessionActive || saving || rowStaged}>
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

const EditGroupForm = ({
  dataRow,
  dataSource,
}: GroupsEditFormProps) => {
  const { isEditMode, setEditMode } = useEditMode();
  const groupId = typeof dataRow.group_id === "string" ? dataRow.group_id : "";
  const roleFilter = useMemo(
    () =>
      groupId && !/["\\\t\r\n]/.test(groupId)
        ? filterAsQuery({ op: "=", column: "group_id", value: groupId })
        : undefined,
    [groupId],
  );
  const roles = useLookupRows(rolesTable, roleColumns, true);
  const assignedRoles = useLookupRows(
    groupRolesTable,
    groupRoleColumns,
    !!groupId && !!roleFilter,
    roleFilter,
  );
  const [selectedItems, setSelectedItems] = useState<GroupRoleItem[]>([]);
  const [staging, setStaging] = useState(false);
  const [error, setError] = useState<string>();
  const originalRoleIds = useRef<string[] | undefined>(undefined);
  const originalRoleItems = useRef<GroupRoleItem[]>([]);
  const handleSaveSuccess = useCallback(() => {
    originalRoleIds.current = selectedItems.map(({ name }) => name);
    originalRoleItems.current = selectedItems;
    setEditMode(false);
  }, [selectedItems, setEditMode]);
  const { editSession, onCancel: cancelEdit, onSave } = useEditable({
    dataSource,
    onCancel: () => setEditMode(false),
    onSave: handleSaveSuccess,
  });
  const { showNotification } = useNotifications();
  const [sessionActive, setSessionActive] = useState(
    editSession.lifecycle.status === "active",
  );
  const allRoleItems = useMemo(() => roleItemsFromRows(roles.rows), [roles.rows]);

  useEffect(() => {
    if (roles.loading || assignedRoles.loading || !groupId) return;
    const roleItemsById = new Map(
      allRoleItems.map((item) => [item.name, item]),
    );
    const assignedItems = assignedRoles.rows.flatMap((row) => {
      if (row.group_id !== groupId) return [];
      const roleId = typeof row.role_id === "string" ? row.role_id : "";
      if (!roleId) return [];
      const item =
        roleItemsById.get(roleId) ??
        roleItemFor(row);
      return item ? [item] : [];
    });
    originalRoleIds.current = assignedItems.map(({ name }) => name);
    originalRoleItems.current = assignedItems;
    setSelectedItems(assignedItems);
  }, [
    allRoleItems,
    assignedRoles.loading,
    assignedRoles.rows,
    groupId,
    roles.loading,
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

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) => {
      if (!isEditMode) return;
      const byName = new Map(allRoleItems.map((item) => [item.name, item]));
      const nextItems = items.flatMap((item) => {
        const role = byName.get(item.name);
        return role ? [role] : [];
      });
      const original = originalRoleIds.current;
      if (!original) return;
      const value = JSON.stringify(nextItems.map(({ name }) => name));
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
    [allRoleItems, dataRow.key, editSession, isEditMode, showNotification],
  );

  const onCancel = useCallback(() => {
    setSelectedItems(originalRoleItems.current);
    setError(undefined);
    cancelEdit();
  }, [cancelEdit]);

  const lookupError =
    roles.error ??
    assignedRoles.error ??
    (!groupId
      ? "Backend contract unavailable: this group is missing its group ID."
      : !roleFilter
      ? "This group has an ID that cannot be safely used in an assignment query."
      : undefined);

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
            {roles.loading || assignedRoles.loading ? (
              <p role="status">Loading group roles...</p>
            ) : !isEditMode || !sessionActive || staging || lookupError ? (
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
