import {
  DataEditingProvider,
  EditButtons,
  EditField,
  useEditable,
  useEditMode,
  useLookupValues,
  type EditLifecycle,
  type LookupOption,
} from "@vuu-ui/vuu-data-editing";
import {
  Button,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Option,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
} from "@salt-ds/core";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { isRpcError } from "@vuu-ui/vuu-utils";
import { errorMessage } from "../../data/admin-contract";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";

import "./RolesEditForm.css";

const classBase = "vuuRolesEditForm";

const clientTable = { module: "USER_ADMIN", table: "clients" };
const clientOptionMap = {
  additionalFields: ["client_identifier"],
  label: "client_name",
  value: "client_id",
};
const newRoleColumns = [
  "client_id",
  "client_name",
  "client_identifier",
  "role_name",
  "description",
];
const requiredRoleColumns = ["client_id", "client_identifier", "role_name"];

export interface RolesEditFormProps {
  dataRow: DataRow;
  dataSource: DataSource;
  onClose?: () => void;
}

const CreateRoleForm = ({
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
  const clients = useLookupValues({
    enabled: true,
    optionMap: clientOptionMap,
    table: clientTable,
  });
  const [client, setClient] = useState<LookupOption>();
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

  const onClientSelectionChange = useCallback(
    (_event: SyntheticEvent, [selectedClient]: LookupOption[]) => {
      if (!selectedClient) return;
      setClient(selectedClient);
      editSession.setNewRowValue("client_id", String(selectedClient.value));
      editSession.setNewRowValue("client_name", selectedClient.label);
      editSession.setNewRowValue(
        "client_identifier",
        selectedClient.metadata?.client_identifier ?? "",
      );
      setError(undefined);
    },
    [editSession],
  );

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
          setError("Client is required.");
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
            <FormFieldLabel>Client</FormFieldLabel>
            <Dropdown<LookupOption>
              data-icon="triangle-down"
              onSelectionChange={onClientSelectionChange}
              placeholder="Please select value"
              value={client?.label ?? ""}
            >
              {clients.map((option) => (
                <Option key={option.value} value={option}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
            <FormFieldHelperText>
              Choose the client that owns this role.
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
        <div className="vuuIdentityAdmin-formActions">
          <Button type="submit" disabled={!sessionActive || saving || created}>
            Save
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => void closeSession()}
          >
            {created ? "Close" : "Cancel"}
          </Button>
        </div>
      </form>
    </DataEditingProvider>
  );
};

const EditRoleForm = ({ dataRow, dataSource }: RolesEditFormProps) => {
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
      <Toolbar>
        <ToggleButtonGroup
          onChange={onToggleEditMode}
          value={isEditMode ? "edit" : "view"}
        >
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>

      <form className={classBase}>
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
      </form>
      <EditButtons
        canCancel={editSession.canCancel}
        canSave={editSession.canSave}
        editSession={editSession}
        onCancel={onCancel}
        onSave={onSave}
      />
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
