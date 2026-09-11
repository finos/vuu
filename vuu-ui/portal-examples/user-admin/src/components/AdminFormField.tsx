import {
  Button,
  Checkbox,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import { useId, useState, type ReactNode } from "react";
import type { AdminRecord, Entity } from "../data/admin-contract";
import { columnFor } from "../data/admin-contract";
import { useAdminConfig } from "../data/AdminDataContext";
import { AdminSearch } from "./AdminSearch";
import { AdminTable } from "./AdminTable";

export interface AdminFieldsProps {
  values: AdminRecord;
  disabled: boolean;
  editing?: boolean;
  relationships?: ReactNode;
  supports: (field: string) => boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export const FORM_FIELDS: Record<Entity, string[]> = {
  users: [
    "username",
    "email",
    "first_name",
    "last_name",
    "enabled",
    "password_update_required",
    "temporary_password",
  ],
  groups: ["group_name", "group_path", "parent_group_id"],
  roles: ["role_name", "client_id", "description"],
};
export const REQUIRED_FIELDS: Record<Entity, string[]> = {
  users: ["username"],
  groups: ["group_name"],
  roles: ["role_name", "client_id"],
};

export const AdminFormField = ({
  field,
  label,
  type = "text",
  required = false,
  ...props
}: AdminFieldsProps & {
  field: string;
  label: string;
  type?: "text" | "email" | "password" | "checkbox";
  required?: boolean;
}) => {
  const id = useId();
  const supported = props.supports(field);
  const disabled = props.disabled || !supported;
  return (
    <FormField disabled={disabled}>
      <FormFieldLabel htmlFor={id}>
        {label}
        {required ? " (required)" : ""}
      </FormFieldLabel>
      {type === "checkbox" ? (
        <Checkbox
          inputProps={{ id, "aria-label": label }}
          checked={props.values[field] === true}
          disabled={disabled}
          onChange={(event) => props.onChange(field, event.target.checked)}
        />
      ) : (
        <Input
          value={String(props.values[field] ?? "")}
          disabled={disabled}
          inputProps={{
            id,
            type,
            required,
            autoComplete: type === "password" ? "new-password" : "off",
            onChange: (event) => props.onChange(field, event.target.value),
          }}
        />
      )}
      <FormFieldHelperText>
        {!supported
          ? "Backend contract unavailable: this field needs a supported identity RPC and, unless write-only, a writable Vuu schema column."
          : type === "password"
            ? "Leave blank to keep the current password. Never displayed after saving."
            : required
              ? "A value is required."
              : "Optional."}
      </FormFieldHelperText>
    </FormField>
  );
};

export const AdminLookupField = ({
  field,
  label,
  table,
  idField,
  labelField,
  required = false,
  ...props
}: AdminFieldsProps & {
  field: string;
  label: string;
  table: "clients" | "groups";
  idField: string;
  labelField: string;
  required?: boolean;
}) => {
  const config = useAdminConfig();
  const [search, setSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [error, setError] = useState("");
  const supported = props.supports(field);
  const disabled = props.disabled || !supported;
  const selected = String(props.values[field] ?? "");
  return (
    <FormField disabled={disabled}>
      <FormFieldLabel>
        {label}
        {required ? " (required)" : ""}
      </FormFieldLabel>
      <fieldset disabled={disabled} className="vuuIdentityAdmin-searchFieldset">
        <AdminSearch label={`Search ${table}`} onSearch={setSearch} />
        {!disabled ? (
          <AdminTable
            name={table}
            query={{ search }}
            title={`Choose ${label.toLowerCase()}`}
            onSelect={(record) => {
              if (!record) return;
              const id = record[columnFor(config, table, idField)];
              if (typeof id !== "string" || !id) {
                setError(`The selected row is missing ${idField}.`);
                return;
              }
              setError("");
              props.onChange(field, id);
              setSelectedLabel(
                String(record[columnFor(config, table, labelField)] ?? id),
              );
            }}
          />
        ) : null}
        {!required ? (
          <Button
            type="button"
            disabled={disabled || !selected}
            onClick={() => {
              props.onChange(field, "");
              setSelectedLabel("");
            }}
          >
            Clear {label.toLowerCase()}
          </Button>
        ) : null}
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
      <FormFieldHelperText>
        {!supported
          ? "Backend contract unavailable: this selection is not writable in the Vuu schema."
          : selected
            ? `Selected: ${selectedLabel || selected} (${selected})`
            : `No ${label.toLowerCase()} selected. Search with Enter, then select a row from Vuu.`}
      </FormFieldHelperText>
    </FormField>
  );
};
