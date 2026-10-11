import {
  EditField,
  type EditFormValidator,
  useEditFormContext,
} from "@vuu-ui/vuu-data-editing";
import {
  Banner,
  BannerContent,
  Code,
  Divider,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Option,
  Text,
} from "@salt-ds/core";
import { UserGroupIcon } from "@salt-ds/icons";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import {
  TableEditorButtons,
  TableEditorCreateForm,
  TableEditorModeToggle,
  useTableEditor,
} from "@vuu-ui/vuu-table-extras";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { AppAvatar, GroupName, plural } from "../admin-ui/AdminUi";
import { type ApplicationDetails, classifyRole } from "../../data/applications";
import {
  useApplicationModel,
  useApplications,
} from "../../data/useApplicationModel";
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./RolesEditForm.css";

const classBase = "vuuRolesEditForm";

const RoleApplicationSummary = ({ dataRow }: { dataRow: DataRow }) => {
  const { applications } = useApplications();
  const match = useMemo(
    () =>
      classifyRole(applications, dataRow.role_name, dataRow.client_identifier),
    [applications, dataRow.client_identifier, dataRow.role_name],
  );
  return (
    <dl className="vuuIdentityAdmin-details">
      <div>
        <dt>Application</dt>
        <dd>
          {match ? (
            <span className="vuuAdminApplicationCell">
              <AppAvatar application={match.application} size={0.9} />
              {match.application.title}
            </span>
          ) : (
            "Unassigned"
          )}
        </dd>
      </div>
      <div>
        <dt>Role type</dt>
        <dd>
          {match?.kind === "access"
            ? "Portal access role"
            : match
              ? "Application role"
              : "Not linked to an application"}
        </dd>
      </div>
      <div>
        <dt>Client</dt>
        <dd>
          <Code>{String(dataRow.client_identifier ?? "")}</Code>
        </dd>
      </div>
    </dl>
  );
};

/** The groups a role is assigned to, from the application model. */
const RoleGroups = ({ dataRow }: { dataRow: DataRow }) => {
  const { model } = useApplicationModel();
  const roleId = String(dataRow.role_id ?? "");
  const groups = [...model.groupsById.values()].filter(({ roleIds }) =>
    roleIds.includes(roleId),
  );
  return (
    <section className="vuuIdentityAdmin-section">
      <Text className="vuuIdentityAdmin-sectionTitle">
        {groups.length === 0
          ? "Not included in any group"
          : `Included in ${plural(groups.length, "group")}`}
      </Text>
      {groups.length > 0 ? (
        <ul aria-label="Groups with this role" className="vuuAdminUi-roleList">
          {groups.map((group) => {
            const application = model.byName.get(
              model.groupApplication.get(group.groupId) ?? "",
            )?.application;
            return (
              <li className="vuuAdminUi-roleRow" key={group.groupId}>
                <span className="vuuAdminUi-roleRowIcon">
                  <UserGroupIcon aria-hidden />
                </span>
                <GroupName
                  name={group.groupName}
                  prefix={application?.groupPrefix}
                />
                <Text color="secondary" styleAs="label">
                  {plural(group.userCount, "member")}
                </Text>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};

const AccessRoleDetails = ({ dataRow }: { dataRow: DataRow }) => {
  const { applications } = useApplications();
  const title =
    classifyRole(applications, dataRow.role_name, dataRow.client_identifier)
      ?.application.title ?? "";
  return (
    <>
      <Banner status="info">
        <BannerContent role="note">
          This role controls who can open {title}. It is defined by the
          application's module descriptor and cannot be changed here. Every{" "}
          {title} group includes it.
        </BannerContent>
      </Banner>
      <RoleApplicationSummary dataRow={dataRow} />
      <EditField
        dataRow={dataRow}
        label="Role name"
        name="role_name"
        readOnly
      />
      <EditField
        dataRow={dataRow}
        label="Description"
        name="description"
        readOnly
      />
      <Divider variant="tertiary" />
      <RoleGroups dataRow={dataRow} />
    </>
  );
};

const ApplicationRoleForm = ({ dataRow }: { dataRow: DataRow }) => {
  const { isEditing } = useTableEditor();
  return (
    <>
      <div className="vuuIdentityAdmin-mode">
        <Text color="secondary" styleAs="label">
          {isEditing
            ? "Editing. Save or cancel your changes."
            : "Switch to Edit to change this role."}
        </Text>
        <TableEditorModeToggle />
      </div>
      <div className={classBase}>
        <RoleApplicationSummary dataRow={dataRow} />
        <EditField label="Client name" name="client_name" readOnly />
        <EditField label="Role name" name="role_name" required />
        <EditField label="Description" name="description" />
        <Divider variant="tertiary" />
        <RoleGroups dataRow={dataRow} />
      </div>
      <div className="vuuIdentityAdmin-panelFooter">
        <TableEditorButtons />
      </div>
    </>
  );
};

/**
 * Content for a `TableEditorForm`, showing the selected role. Portal access
 * roles are read-only, application roles can be edited.
 */
export const RoleEditForm = () => {
  const form = useEditFormContext();
  const { applications } = useApplications();
  const dataRow = form?.dataRow;
  if (dataRow === undefined) {
    throw Error("RoleEditForm must be rendered within an EditForm");
  }
  const isAccessRole =
    classifyRole(applications, dataRow.role_name, dataRow.client_identifier)
      ?.kind === "access";
  return isAccessRole ? (
    <div className={classBase}>
      <AccessRoleDetails dataRow={dataRow} />
    </div>
  ) : (
    <ApplicationRoleForm dataRow={dataRow} />
  );
};

const stringValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateRole: EditFormValidator = (values) => {
  const errors: Record<string, string> = {};
  if (!stringValue(values.role_name)) {
    errors.role_name = "Role name is required.";
  }
  if (!stringValue(values.client_id)) {
    errors.client_id = "Application is required.";
  }
  return errors;
};

/** Stages the selected application's client in the enclosing create form. */
const NewRoleValues = ({ entry }: { entry?: ApplicationDetails }) => {
  const setValue = useEditFormContext()?.setValue;
  const { client } = entry ?? {};
  useEffect(() => {
    // the description is optional, but always part of the new row
    setValue?.("description", "");
  }, [setValue]);
  useEffect(() => {
    if (client) {
      setValue?.("client_id", client.clientId);
      setValue?.("client_name", client.clientName);
      setValue?.("client_identifier", client.clientIdentifier);
    }
  }, [client, setValue]);
  return null;
};

const ApplicationField = ({
  entry,
  onChange,
}: {
  entry?: ApplicationDetails;
  onChange: (entry: ApplicationDetails) => void;
}) => {
  const { model } = useApplicationModel();
  const error = useEditFormContext()?.fieldErrors.client_id;
  const onSelectionChange = useCallback(
    (_event: SyntheticEvent, [selected]: ApplicationDetails[]) => {
      if (selected) onChange(selected);
    },
    [onChange],
  );
  return (
    <FormField
      className="vuuRolesEditForm-clientField"
      necessity="asterisk"
      validationStatus={error ? "error" : undefined}
    >
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
        onSelectionChange={onSelectionChange}
        placeholder="Please select value"
        value={entry?.application.title ?? ""}
      >
        {model.applications.map((candidate) => (
          <Option
            disabled={!candidate.client}
            key={candidate.application.name}
            value={candidate}
          >
            {candidate.application.title}
          </Option>
        ))}
      </Dropdown>
      <FormFieldHelperText>
        {error ??
          (entry?.client
            ? `The role is created on the ${entry.client.clientName || entry.client.clientIdentifier} client. Add it to one of the application's groups to grant it to users.`
            : "Choose the application this role belongs to.")}
      </FormFieldHelperText>
    </FormField>
  );
};

export interface CreateRoleFormProps {
  /** Application to preselect. */
  application?: string;
}

const CreateRoleFormContent = ({
  application: defaultApplication,
}: CreateRoleFormProps) => {
  const { showNotification } = useNotifications();
  const { model } = useApplicationModel();
  const [applicationName, setApplicationName] = useState(defaultApplication);
  const candidate = model.byName.get(applicationName ?? "");
  const entry = candidate?.client ? candidate : undefined;

  const onApplicationChange = useCallback(
    (selected: ApplicationDetails) =>
      setApplicationName(selected.application.name),
    [],
  );

  const handleSaved = useCallback(() => {
    showNotification({
      type: "toast",
      status: "success",
      header: "Role created",
      content: "The role was created successfully.",
    });
  }, [showNotification]);

  return (
    <TableEditorCreateForm
      className={classBase}
      onSaved={handleSaved}
      showButtons={false}
      validate={validateRole}
    >
      <NewRoleValues entry={entry} />
      <ApplicationField entry={entry} onChange={onApplicationChange} />
      <EditField label="Role name" name="role_name" required />
      <EditField label="Description" name="description" />
      <div className="vuuIdentityAdmin-panelFooter">
        <TableEditorButtons />
      </div>
    </TableEditorCreateForm>
  );
};

/**
 * Creates an application role, shown while the enclosing `TableWithEditForm`
 * is creating a row.
 */
export const CreateRoleForm = (props: CreateRoleFormProps) => {
  const { mode } = useTableEditor();
  // mounted per create, so each new role starts from a blank form
  return mode === "create" ? <CreateRoleFormContent {...props} /> : null;
};
