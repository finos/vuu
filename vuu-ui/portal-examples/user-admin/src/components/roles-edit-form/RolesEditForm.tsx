import {
  DataEditingProvider,
  EditButtons,
  EditField,
  useEditable,
  useEditMode,
  type EditLifecycle,
} from "@vuu-ui/vuu-data-editing";
import {
  Banner,
  BannerContent,
  Button,
  Code,
  Divider,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Option,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { UserGroupIcon } from "@salt-ds/icons";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { isRpcError } from "@vuu-ui/vuu-utils";
import { errorMessage } from "../../data/admin-contract";
import { AppAvatar, GroupName, plural } from "../admin-ui/AdminUi";
import { type ApplicationDetails, classifyRole } from "../../data/applications";
import {
  useApplicationModel,
  useApplications,
} from "../../data/useApplicationModel";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";

import "./RolesEditForm.css";

const classBase = "vuuRolesEditForm";

const newRoleColumns = [
  "client_id",
  "client_name",
  "client_identifier",
  "role_name",
  "description",
];
const requiredRoleColumns = ["client_id", "client_identifier", "role_name"];

export interface RolesEditFormProps {
  /** Application to preselect when creating a role. */
  application?: string;
  dataRow: DataRow;
  dataSource: DataSource;
  onClose?: () => void;
}

const CreateRoleForm = ({
  application: defaultApplication,
  dataRow,
  dataSource,
  onClose,
}: RolesEditFormProps) => {
  const { setEditMode } = useEditMode();
  const { showNotification } = useNotifications();
  const noOp = useCallback(() => undefined, []);
  const { editSession } = useEditable({
    copyOption: "Empty",
    dataSource,
    onCancel: noOp,
    onSave: noOp,
  });
  const { model } = useApplicationModel();
  const [application, setApplication] = useState<ApplicationDetails>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [rowStaged, setRowStaged] = useState(false);
  const [sessionActive, setSessionActive] = useState(
    editSession.lifecycle.status === "active",
  );
  const savingRef = useRef(false);

  useEffect(() => {
    editSession.configureNewRow(newRoleColumns, requiredRoleColumns);
    const onLifecycle = (lifecycle: EditLifecycle) => {
      setSessionActive(
        lifecycle.status === "active" ||
          (lifecycle.status === "error" && lifecycle.operation === "end"),
      );
      if (lifecycle.status === "error") {
        setError(lifecycle.error.message);
      }
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

  const selectApplication = useCallback(
    (entry: ApplicationDetails | undefined) => {
      setApplication(entry);
      const { client } = entry ?? {};
      editSession.setNewRowValue("client_id", client?.clientId ?? "");
      editSession.setNewRowValue("client_name", client?.clientName ?? "");
      editSession.setNewRowValue(
        "client_identifier",
        client?.clientIdentifier ?? "",
      );
      setError(undefined);
    },
    [editSession],
  );

  const onApplicationSelectionChange = useCallback(
    (_event: SyntheticEvent, [entry]: ApplicationDetails[]) => {
      if (entry) selectApplication(entry);
    },
    [selectApplication],
  );

  const preselected = useRef(false);
  useEffect(() => {
    if (preselected.current || !sessionActive || !defaultApplication) return;
    const entry = model.byName.get(defaultApplication);
    if (entry?.client) {
      preselected.current = true;
      selectApplication(entry);
    }
  }, [defaultApplication, model, selectApplication, sessionActive]);

  const closeSession = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await editSession.end(false);
      savingRef.current = false;
      setSaving(false);
      close();
    } catch (cause) {
      const message = created
        ? `Role created, but the edit session could not be closed: ${errorMessage(cause)}`
        : errorMessage(cause);
      setError(message);
      savingRef.current = false;
      setSaving(false);
    }
  }, [close, created, editSession]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (savingRef.current || created) return;
      if (!sessionActive) {
        setError("The role edit session is not ready yet.");
        return;
      }

      let rowValues:
        | {
            clientId: string;
            clientIdentifier: string;
            description: string;
            roleName: string;
          }
        | undefined;
      if (!rowStaged) {
        const draft = editSession.newRowState.values;
        const roleName =
          typeof draft.role_name === "string" ? draft.role_name.trim() : "";
        if (!roleName) {
          setError("Role name is required.");
          return;
        }
        const clientId = draft.client_id;
        if (typeof clientId !== "string" || !clientId.trim()) {
          setError("Application is required.");
          return;
        }

        if (
          typeof draft.client_identifier !== "string" ||
          !draft.client_identifier.trim()
        ) {
          setError("Client identifier is required.");
          return;
        }
        rowValues = {
          clientId,
          clientIdentifier: draft.client_identifier,
          description:
            typeof draft.description === "string" ? draft.description : "",
          roleName,
        };
      }

      savingRef.current = true;
      setSaving(true);
      setError(undefined);

      let shouldClose = false;
      try {
        if (!rowStaged) {
          if (!rowValues) throw new Error("Role details are unavailable.");
          editSession.setNewRowValue("client_id", rowValues.clientId);
          editSession.setNewRowValue(
            "client_identifier",
            rowValues.clientIdentifier,
          );
          editSession.setNewRowValue("role_name", rowValues.roleName);
          editSession.setNewRowValue("description", rowValues.description);
          const result = await editSession.addNewRow();
          if (isRpcError(result)) throw new Error(result.errorMessage);
          if (Object.keys(editSession.newRowState.errors).length > 0) {
            throw new Error("Complete the required role fields before saving.");
          }
          setRowStaged(true);
        }

        await editSession.end(true);
        setCreated(true);
        showNotification({
          type: "toast",
          status: "success",
          header: "Role created",
          content: "The role was created successfully.",
        });
        shouldClose = true;
      } catch (cause) {
        const message = errorMessage(cause);
        setError(message);
        showNotification({
          type: "toast",
          status: "error",
          header: "Role creation failed",
          content: message,
          dismissal: "manual",
        });
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      if (shouldClose) close();
    },
    [close, created, editSession, rowStaged, sessionActive, showNotification],
  );

  return (
    <DataEditingProvider editSession={editSession}>
      <form className={classBase} onSubmit={onSubmit}>
        {error ? <p role="alert">{error}</p> : null}
        {!sessionActive && !error ? (
          <p role="status">Starting edit session...</p>
        ) : null}
        {saving ? <p role="status">Saving role...</p> : null}
        {created ? (
          <p role="status">Role created. Close the editor to continue.</p>
        ) : null}
        <fieldset disabled={!sessionActive || saving || created || rowStaged}>
          <FormField
            className="vuuRolesEditForm-clientField"
            necessity="asterisk"
          >
            <FormFieldLabel>Application</FormFieldLabel>
            <Dropdown<ApplicationDetails>
              aria-label="Application"
              bordered
              data-icon="triangle-down"
              startAdornment={
                application ? (
                  <AppAvatar
                    application={application.application}
                    size={0.75}
                  />
                ) : undefined
              }
              onSelectionChange={onApplicationSelectionChange}
              placeholder="Please select value"
              value={application?.application.title ?? ""}
            >
              {model.applications.map((entry) => (
                <Option
                  disabled={!entry.client}
                  key={entry.application.name}
                  value={entry}
                >
                  {entry.application.title}
                </Option>
              ))}
            </Dropdown>
            <FormFieldHelperText>
              {application?.client
                ? `The role is created on the ${application.client.clientName || application.client.clientIdentifier} client. Add it to one of the application's groups to grant it to users.`
                : "Choose the application this role belongs to."}
            </FormFieldHelperText>
          </FormField>
          <EditField
            dataRow={dataRow}
            deferNewRow
            label="Role name"
            name="role_name"
            required
          />
          <EditField
            dataRow={dataRow}
            deferNewRow
            label="Description"
            name="description"
          />
        </fieldset>
        <div className="vuuIdentityAdmin-panelFooter">
          <Button
            appearance="bordered"
            disabled={saving}
            onClick={() => void closeSession()}
            sentiment="neutral"
            type="button"
          >
            {created ? "Close" : "Cancel"}
          </Button>
          <Button
            disabled={!sessionActive || saving || created}
            sentiment="accented"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </DataEditingProvider>
  );
};

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
    <form className={classBase}>
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
    </form>
  );
};

const EditRoleForm = (props: RolesEditFormProps) => {
  const { applications } = useApplications();
  const isAccessRole =
    classifyRole(
      applications,
      props.dataRow.role_name,
      props.dataRow.client_identifier,
    )?.kind === "access";
  return isAccessRole ? (
    <AccessRoleDetails dataRow={props.dataRow} />
  ) : (
    <EditApplicationRoleForm {...props} />
  );
};

const EditApplicationRoleForm = ({
  dataRow,
  dataSource,
}: RolesEditFormProps) => {
  const { isEditMode, setEditMode } = useEditMode();
  const { editSession, onCancel, onSave } = useEditable({
    dataSource,
    onCancel: () => setEditMode(false),
    onSave: () => setEditMode(false),
  });

  const onToggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  return (
    <DataEditingProvider editSession={editSession}>
      <div className="vuuIdentityAdmin-mode">
        <Text color="secondary" styleAs="label">
          {isEditMode
            ? "Editing. Save or cancel your changes."
            : "Switch to Edit to change this role."}
        </Text>
        <ToggleButtonGroup
          aria-label="Mode"
          onChange={onToggleEditMode}
          value={isEditMode ? "edit" : "view"}
        >
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <form className={classBase}>
        <RoleApplicationSummary dataRow={dataRow} />
        <EditField
          dataRow={dataRow}
          label="Client name"
          name="client_name"
          readOnly
        />
        <EditField
          dataRow={dataRow}
          label="Role name"
          name="role_name"
          required
        />
        <EditField dataRow={dataRow} label="Description" name="description" />
        <Divider variant="tertiary" />
        <RoleGroups dataRow={dataRow} />
      </form>
      <div className="vuuIdentityAdmin-panelFooter">
        <EditButtons
          canCancel={editSession.canCancel}
          canSave={editSession.canSave}
          editSession={editSession}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    </DataEditingProvider>
  );
};

export const RolesEditForm = (props: RolesEditFormProps) =>
  props.dataRow.role_id === undefined ? (
    <CreateRoleForm {...props} />
  ) : (
    <EditRoleForm {...props} />
  );

export const RoleEditForm = RolesEditForm;
