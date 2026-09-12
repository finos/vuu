import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
} from "@salt-ds/core";
import { useState } from "react";
import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  errorMessage,
  requireVuuClient,
  type AdminRecord,
} from "../data/admin-contract";
import type { RelationshipChange } from "../data/admin-mutations";
import { AdminSearch } from "./AdminSearch";
import { AdminTable } from "./AdminTable";

export const AdminRelationshipField = ({
  entity,
  record,
  disabled,
  changes,
  onChange,
}: {
  entity: "users" | "groups";
  record?: AdminRecord;
  disabled: boolean;
  changes: RelationshipChange[];
  onChange: (changes: RelationshipChange[]) => void;
}) => {
  const config = useAdminConfig();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const target = entity === "users" ? "groups" : "roles";
  const relation = entity === "users" ? "user_groups" : "group_roles";
  const ownerField = entity === "users" ? "user_id" : "group_id";
  const ownerId = record?.[columnFor(config, entity, ownerField)];
  const idField = entity === "users" ? "group_id" : "role_id";
  const labelField = entity === "users" ? "group_name" : "role_name";
  const stage = (
    row: AdminRecord | undefined,
    action: RelationshipChange["action"],
  ) => {
    if (!row) return;
    const table = action === "add" ? target : relation;
    const id = row[columnFor(config, table, idField)];
    const client = row[columnFor(config, table, "client_id")];
    let clientIdentifier: string | undefined;
    if (
      typeof id !== "string" ||
      !id ||
      (entity === "groups" && (typeof client !== "string" || !client))
    ) {
      setError(
        `The selected row needs ${idField}${entity === "groups" ? " and client_id" : ""} to change this relationship.`,
      );
      return;
    }
    if (entity === "groups") {
      try {
        clientIdentifier = requireVuuClient(
          row[columnFor(config, table, "client_identifier")],
        );
      } catch (cause) {
        setError(errorMessage(cause));
        return;
      }
    }
    setError("");
    onChange([
      ...changes.filter((change) => change.id !== id),
      {
        action,
        id,
        label: String(row[columnFor(config, table, labelField)] ?? id),
        clientId: typeof client === "string" ? client : undefined,
        clientIdentifier,
      },
    ]);
  };
  if (!record) {
    return (
      <FormField disabled>
        <FormFieldLabel>
          {entity === "users" ? "Group membership" : "Client-role assignments"}
        </FormFieldLabel>
        <FormFieldHelperText>
          Save this identity, then reopen it to edit assignments. The create RPC
          does not return a stable identity ID.
        </FormFieldHelperText>
      </FormField>
    );
  }
  return (
    <FormField disabled={disabled}>
      <FormFieldLabel>
        {entity === "users" ? "Group membership" : "Client-role assignments"}
      </FormFieldLabel>
      <FormFieldHelperText>
        Select a row to stage an addition or removal. Changes are sent only on
        Save.
      </FormFieldHelperText>
      <fieldset disabled={disabled} className="vuuIdentityAdmin-searchFieldset">
        <AdminSearch label={`Find ${target} to add`} onSearch={setSearch} />
        {!disabled ? (
          <div className="vuuIdentityAdmin-relationships">
            <AdminTable
              name={target}
              query={{ search }}
              title={`Select ${entity === "users" ? "a group" : "a client role"} to add`}
              onSelect={(row) => stage(row, "add")}
            />
            {typeof ownerId === "string" && ownerId ? (
              <AdminTable
                name={relation}
                query={{ equals: { field: ownerField, value: ownerId } }}
                title="Select an existing assignment to remove"
                onSelect={(row) => stage(row, "remove")}
              />
            ) : record ? (
              <p role="alert">
                The server must provide {ownerField} to remove assignments.
              </p>
            ) : null}
          </div>
        ) : null}
        {changes.length ? (
          <ul aria-label="Pending relationship changes">
            {changes.map((change) => (
              <li key={change.id}>
                {change.action === "add" ? "Add" : "Remove"} {change.label}
                <Button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange(changes.filter(({ id }) => id !== change.id))
                  }
                >
                  Undo {change.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
      <FormFieldHelperText>
        Identity and relationship RPCs are separate operations. If a later
        operation fails, confirmed changes remain saved; retry Save to finish
        the remaining changes.
      </FormFieldHelperText>
    </FormField>
  );
};
