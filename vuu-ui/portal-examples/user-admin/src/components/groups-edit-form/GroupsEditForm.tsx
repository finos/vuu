import {
  EditField,
  type EditFormValidator,
  useCustomEditField,
  useEditFormContext,
} from "@vuu-ui/vuu-data-editing";
import {
  Banner,
  BannerContent,
  Button,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Option,
  Tab,
  TabBar,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Tag,
  Text,
} from "@salt-ds/core";
import { KeyIcon, LockedIcon } from "@salt-ds/icons";
import {
  TableEditorButtons,
  TableEditorCreateForm,
  TableEditorModeToggle,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import { type ItemDescriptor, ItemPicker } from "@vuu-ui/vuu-ui-controls";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { errorMessage } from "../../data/admin-contract";
import {
  AppAvatar,
  RoleList,
  RoleRow,
  useApplicationCategory,
} from "../admin-ui/AdminUi";
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
      <Banner status="error">
        <BannerContent role="alert">
          Access role "{application.accessRole}" was not found on the vuu-portal
          client. Members of this group cannot open {application.title}.
        </BannerContent>
      </Banner>
    );
  }
  return included ? (
    <Banner className={`${classBase}-accessRole`} status="info">
      <BannerContent role="note">
        Includes access role <strong>{accessRole.roleName}</strong>, which lets
        members open {application.title}.
      </BannerContent>
    </Banner>
  ) : (
    <Banner status="warning">
      <BannerContent role="alert">
        This group does not include access role {accessRole.roleName}, so its
        members cannot open {application.title}.
      </BannerContent>
    </Banner>
  );
};

const accessRoleItemFor = (
  entry: ApplicationDetails | undefined,
): GroupRoleItem | undefined =>
  entry?.accessRole
    ? {
        label: `${entry.accessRole.roleName} (${entry.application.title} access, always included)`,
        name: entry.accessRole.roleId,
      }
    : undefined;

const SelectedRoles = ({
  "aria-label": ariaLabel = "Assigned roles",
  entry,
  items,
}: {
  "aria-label"?: string;
  entry?: ApplicationDetails;
  items: GroupRoleItem[];
}) => {
  const { model } = useApplicationModel();
  const category = useApplicationCategory(entry?.application.name);
  if (items.length === 0) {
    return (
      <Text color="secondary" role="status">
        No roles assigned.
      </Text>
    );
  }
  return (
    <RoleList aria-label={ariaLabel}>
      {items.map((item) => {
        const role = model.rolesById.get(item.name);
        const isAccessRole = item.name === entry?.accessRole?.roleId;
        const roleApplication = model.byName.get(
          model.roleApplication.get(item.name) ?? "",
        )?.application;
        const ownRole =
          !!entry && roleApplication?.name === entry.application.name;
        return (
          <RoleRow
            description={
              isAccessRole && entry
                ? `Lets members open ${entry.application.title}`
                : (roleApplication?.title ?? role?.clientIdentifier)
            }
            end={
              isAccessRole ? (
                <Tag bordered>Always included</Tag>
              ) : ownRole ? (
                <Tag category={category}>Application</Tag>
              ) : entry ? (
                <Tag bordered>Other application</Tag>
              ) : null
            }
            icon={
              isAccessRole ? (
                <LockedIcon aria-hidden />
              ) : (
                <KeyIcon aria-hidden />
              )
            }
            key={item.name}
            name={role?.roleName ?? item.label ?? item.name}
          />
        );
      })}
    </RoleList>
  );
};

const withAccessRole = (
  accessRole: GroupRoleItem | undefined,
  items: GroupRoleItem[],
) => (accessRole ? [accessRole, ...items] : items);

/** The access role can't be removed, so it is listed outside the picker. */
const FixedAccessRole = ({
  entry,
  item,
}: {
  entry?: ApplicationDetails;
  item?: GroupRoleItem;
}) =>
  item ? (
    <SelectedRoles aria-label="Access role" entry={entry} items={[item]} />
  ) : null;

const NO_ROLES: readonly string[] = [];

const roleIdsFor = (
  entry: ApplicationDetails | undefined,
  items: readonly GroupRoleItem[],
) => [
  ...(entry?.accessRole ? [entry.accessRole.roleId] : []),
  ...items.map(({ name }) => name),
];

const sameRoleIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

const serializeRoleIds = (roleIds: readonly string[]) =>
  JSON.stringify(roleIds);

const pickedRoleItems = (
  allRoleItems: readonly GroupRoleItem[],
  items: readonly ItemDescriptor[],
) => {
  const byName = new Map(allRoleItems.map((item) => [item.name, item]));
  return items.flatMap((item) => {
    const role = byName.get(item.name);
    return role ? [role] : [];
  });
};

/**
 * The content of the group form, rendered within a `TableEditorForm`. The
 * group's roles are edited as a custom field of the form's edit session, so
 * they are saved, or discarded, with the form.
 */
export const GroupEditForm = () => {
  const { isEditing, selectedRow } = useTableEditor();
  if (selectedRow === undefined) {
    throw Error("GroupEditForm must be rendered within a TableEditorForm");
  }
  const { showNotification } = useNotifications();
  const { error: modelError, loading, model } = useApplicationModel();
  const groupId =
    typeof selectedRow.group_id === "string" ? selectedRow.group_id : "";
  const groupName = groupNameFromPath(selectedRow.group_path) ?? "";
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
      assignedRoles.loading
        ? undefined
        : assignedRoles.rows.flatMap((row) =>
            row.group_id === groupId && typeof row.role_id === "string"
              ? [row.role_id]
              : [],
          ),
    [assignedRoles.loading, assignedRoles.rows, groupId],
  );
  const allRoleItems = useMemo(
    () => assignableRoleItems(model, entry, assignedRoleIds),
    [assignedRoleIds, entry, model],
  );

  const {
    committing,
    error,
    setValue,
    value: roleIds = NO_ROLES,
  } = useCustomEditField<readonly string[]>({
    equals: sameRoleIds,
    name: ROLE_ASSIGNMENTS_COLUMN,
    onError: (cause) =>
      showNotification({
        type: "toast",
        status: "error",
        header: "Unable to stage group roles",
        content: errorMessage(cause),
      }),
    originalValue: assignedRoleIds,
    rowKey: selectedRow.key,
    serialize: serializeRoleIds,
  });

  const selectedItems = useMemo(() => {
    const roleItemsById = new Map(
      allRoleItems.map((item) => [item.name, item]),
    );
    return roleIds.flatMap((roleId) =>
      roleId === accessRoleId
        ? []
        : [roleItemsById.get(roleId) ?? { name: roleId }],
    );
  }, [accessRoleId, allRoleItems, roleIds]);

  // Application groups always keep their access role.
  const stageRoles = useCallback(
    (items: readonly GroupRoleItem[]) =>
      void setValue(roleIdsFor(entry, items)),
    [entry, setValue],
  );

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) =>
      stageRoles(pickedRoleItems(allRoleItems, items)),
    [allRoleItems, stageRoles],
  );

  const lookupError =
    modelError ??
    assignedRoles.error ??
    (!groupId
      ? "Backend contract unavailable: this group is missing its group ID."
      : !roleFilter
        ? "This group has an ID that cannot be safely used in an assignment query."
        : undefined);
  const canStage = isEditing && !committing && !lookupError;
  const hasAccessRole = !!accessRoleId && roleIds.includes(accessRoleId);

  return (
    <>
      <div className="vuuIdentityAdmin-mode">
        <Text color="secondary" styleAs="label">
          {isEditing
            ? "Editing. Save or cancel your changes."
            : "Switch to Edit to change this group's roles."}
        </Text>
        <TableEditorModeToggle />
      </div>
      {error ? <p role="alert">{error.message}</p> : null}
      <div className={classBase}>
        <Tabs defaultValue="GroupDetails">
          <TabBar divider>
            <TabList>
              <Tab value="GroupDetails">
                <TabTrigger>Details</TabTrigger>
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
                <dd>
                  {entry ? (
                    <span className="vuuAdminApplicationCell">
                      <AppAvatar application={entry.application} size={0.9} />
                      {entry.application.title}
                    </span>
                  ) : (
                    "Unassigned"
                  )}
                </dd>
              </div>
            </dl>
            {!entry && !loading ? (
              <Banner status="warning">
                <BannerContent role="note">
                  This group's name does not start with any application's group
                  prefix, so it does not grant access to an application.
                </BannerContent>
              </Banner>
            ) : null}
            <EditField
              label="Display name"
              name="group_display_name"
              readOnly
            />
            <EditField label="Group path" name="group_path" readOnly />
            <EditField label="Users" name="user_count" readOnly />
            <EditField label="Roles" name="role_count" readOnly />
          </TabPanel>
          <TabPanel value="Roles">
            {lookupError ? <p role="alert">{lookupError}</p> : null}
            {loading || assignedRoleIds === undefined ? (
              <p role="status">Loading group roles...</p>
            ) : (
              <>
                {entry ? (
                  <>
                    <AccessRoleNote entry={entry} included={hasAccessRole} />
                    {entry.accessRole && !hasAccessRole && canStage ? (
                      <Button
                        onClick={() => stageRoles(selectedItems)}
                        type="button"
                      >
                        Add access role
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {!canStage ? (
                  <SelectedRoles
                    entry={entry}
                    items={withAccessRole(
                      hasAccessRole ? accessRoleItemFor(entry) : undefined,
                      selectedItems,
                    )}
                  />
                ) : (
                  <>
                    <FixedAccessRole
                      entry={entry}
                      item={
                        hasAccessRole ? accessRoleItemFor(entry) : undefined
                      }
                    />
                    <ItemPicker
                      allItems={allRoleItems}
                      aria-label="Group roles"
                      itemTypeName="role"
                      onSelectedItemsChange={onSelectedItemsChange}
                      selectedItems={selectedItems}
                      style={{ height: 360 }}
                    />
                  </>
                )}
              </>
            )}
          </TabPanel>
        </Tabs>
      </div>
      <div className="vuuIdentityAdmin-panelFooter">
        <TableEditorButtons />
      </div>
    </>
  );
};

const newGroupError = (
  model: ApplicationModel,
  entry: ApplicationDetails | undefined,
  suffix: string,
) => {
  if (!entry) {
    return "Application is required.";
  } else if (!entry.accessRole) {
    return `Access role "${entry.application.accessRole}" was not found, so a ${entry.application.title} group would not grant access.`;
  } else if (!suffix) {
    return "Group name is required.";
  } else if (INVALID_GROUP_SUFFIX.test(suffix)) {
    return "Group names cannot contain spaces or slashes.";
  }
  const groupName = `${entry.application.groupPrefix}${suffix}`;
  if (
    [...model.groupsById.values()].some(
      (group) => group.groupName === groupName,
    )
  ) {
    return `A group named "${groupName}" already exists.`;
  }
};

/**
 * Stages the new group's values in the enclosing create form, and shows why
 * the group can't be created.
 */
const NewGroupValues = ({
  groupName,
  roleAssignments,
}: {
  groupName: string;
  roleAssignments: string;
}) => {
  const form = useEditFormContext();
  const setValue = form?.setValue;
  useEffect(() => {
    setValue?.(GROUP_NAME_COLUMN, groupName);
  }, [groupName, setValue]);
  useEffect(() => {
    setValue?.(ROLE_ASSIGNMENTS_COLUMN, roleAssignments);
  }, [roleAssignments, setValue]);
  const error = form?.fieldErrors[GROUP_NAME_COLUMN];
  return error ? <p role="alert">{error}</p> : null;
};

export interface CreateGroupFormProps {
  /** Application to preselect. */
  application?: string;
}

const CreateGroupFormContent = ({
  application: defaultApplication,
}: CreateGroupFormProps) => {
  const { showNotification } = useNotifications();
  const { error: modelError, loading, model } = useApplicationModel();
  const [applicationName, setApplicationName] = useState(
    defaultApplication ?? "",
  );
  const entry = model.byName.get(applicationName);
  const [suffix, setSuffix] = useState("");
  const [selectedItems, setSelectedItems] = useState<GroupRoleItem[]>([]);
  const allRoleItems = useMemo(
    () => (entry ? assignableRoleItems(model, entry) : []),
    [entry, model],
  );
  const trimmedSuffix = suffix.trim();
  const groupName = entry
    ? `${entry.application.groupPrefix}${trimmedSuffix}`
    : "";

  const validate = useCallback<EditFormValidator>(() => {
    const error = newGroupError(model, entry, trimmedSuffix);
    return error ? { [GROUP_NAME_COLUMN]: error } : undefined;
  }, [entry, model, trimmedSuffix]);

  const handleSaved = useCallback(() => {
    showNotification({
      type: "toast",
      status: "success",
      header: "Group created",
      content: `${groupName} was created. Add users to it to give them access to ${entry?.application.title}.`,
    });
  }, [entry, groupName, showNotification]);

  const onApplicationSelectionChange = useCallback(
    (_event: SyntheticEvent, [selected]: ApplicationDetails[]) => {
      if (selected) {
        setApplicationName(selected.application.name);
        setSelectedItems([]);
      }
    },
    [],
  );

  const onSuffixChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSuffix(event.target.value),
    [],
  );

  const onSelectedItemsChange = useCallback(
    (items: readonly ItemDescriptor[]) =>
      setSelectedItems(pickedRoleItems(allRoleItems, items)),
    [allRoleItems],
  );

  return (
    <TableEditorCreateForm
      className={classBase}
      showButtons={false}
      onSaved={handleSaved}
      validate={validate}
    >
      <NewGroupValues
        groupName={groupName}
        roleAssignments={roleAssignmentsValue(entry, selectedItems)}
      />
      {modelError ? <p role="alert">{modelError}</p> : null}
      <Tabs defaultValue="GroupDetails">
        <TabBar divider>
          <TabList>
            <Tab value="GroupDetails">
              <TabTrigger>Details</TabTrigger>
            </Tab>
            <Tab value="Roles">
              <TabTrigger>Roles</TabTrigger>
            </Tab>
          </TabList>
        </TabBar>
        <TabPanel value="GroupDetails">
          <FormField necessity="asterisk">
            <FormFieldLabel>Application</FormFieldLabel>
            <Dropdown<ApplicationDetails>
              aria-label="Application"
              bordered
              data-icon="triangle-down"
              startAdornment={
                entry ? (
                  <AppAvatar application={entry.application} size={0.75} />
                ) : undefined
              }
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
              bordered
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
        </TabPanel>
        <TabPanel value="Roles">
          {!entry ? (
            <p role="status">Choose an application to see its roles.</p>
          ) : (
            <>
              <AccessRoleNote entry={entry} included />
              <FixedAccessRole entry={entry} item={accessRoleItemFor(entry)} />
              {allRoleItems.length === 0 ? (
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
      <div className="vuuIdentityAdmin-panelFooter">
        <TableEditorButtons />
      </div>
    </TableEditorCreateForm>
  );
};

/**
 * Creates a group, shown while the enclosing `TableWithEditForm` is creating
 * a row. The group is named with its application's prefix and always
 * includes the application's access role.
 */
export const CreateGroupForm = (props: CreateGroupFormProps) => {
  const { mode } = useTableEditor();
  // mounted per create, so each new group starts from a blank form
  return mode === "create" ? <CreateGroupFormContent {...props} /> : null;
};
