import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Switch,
} from "@salt-ds/core";
import type { ChangeEvent } from "react";
import type { UserDetails, UserDetailsErrors } from "../../data/admin-plans";
import type { AccessOption } from "../../components/UserAccessEditor";
import {
  accessGroups,
  groupLabel,
  leastPrivilegedGroup,
} from "../../data/admin-plans";
import type { ApplicationModel } from "../../data/applications";

const PASSWORD_CHARACTERS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

/** A random 16-character password, to be changed at first sign-in. */
export const generatePassword = () => {
  const values = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(
    values,
    (value) => PASSWORD_CHARACTERS[value % PASSWORD_CHARACTERS.length],
  ).join("");
};

/** Every application, offering the groups that grant access to it. */
export const accessOptionsFrom = (
  model: ApplicationModel,
  defaults: ReadonlyMap<string, string> = new Map(),
): AccessOption[] =>
  model.applications.map((entry) => ({
    defaultGroupId:
      defaults.get(entry.application.accessRole) ??
      leastPrivilegedGroup(entry)?.groupId,
    entry,
    groups: accessGroups(entry).map((group) => ({
      groupId: group.groupId,
      label: groupLabel(entry, group),
    })),
  }));

export interface UserDetailsFieldsProps {
  details: UserDetails;
  disabled?: boolean;
  errors: UserDetailsErrors;
  isNew: boolean;
  onChange: (details: UserDetails) => void;
}

/** Username, name, email and, for a new user, a temporary password. */
export const UserDetailsFields = ({
  details,
  disabled = false,
  errors,
  isNew,
  onChange,
}: UserDetailsFieldsProps) => {
  const text =
    (field: Exclude<keyof UserDetails, "enabled">) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...details, [field]: event.target.value });

  const field = (
    name: Exclude<keyof UserDetails, "enabled" | "temporaryPassword">,
    label: string,
    options: { helper?: string; readOnly?: boolean; type?: string } = {},
  ) => (
    <FormField
      disabled={disabled}
      necessity={
        name === "username" || name === "email" ? "required" : undefined
      }
      readOnly={options.readOnly}
      validationStatus={errors[name] ? "error" : undefined}
    >
      <FormFieldLabel>{label}</FormFieldLabel>
      <Input
        bordered
        inputProps={{ autoComplete: "off", type: options.type }}
        onChange={text(name)}
        value={details[name]}
      />
      {errors[name] || options.helper ? (
        <FormFieldHelperText>
          {errors[name] ?? options.helper}
        </FormFieldHelperText>
      ) : null}
    </FormField>
  );

  return (
    <div className="vuuAdminUser-fields">
      {field("username", "Username", {
        helper: isNew
          ? "Used to sign in. It can't be changed later."
          : undefined,
        readOnly: !isNew,
      })}
      {field("email", "Email", { type: "email" })}
      {field("firstName", "First name")}
      {field("lastName", "Last name")}
      {isNew ? (
        <FormField disabled={disabled}>
          <FormFieldLabel>Temporary password</FormFieldLabel>
          <div className="vuuAdminUser-password">
            <Input
              bordered
              inputProps={{ autoComplete: "new-password" }}
              onChange={text("temporaryPassword")}
              value={details.temporaryPassword ?? ""}
            />
            <Button
              disabled={disabled}
              onClick={() =>
                onChange({ ...details, temporaryPassword: generatePassword() })
              }
            >
              Generate
            </Button>
          </div>
          <FormFieldHelperText>
            The user must change it when they first sign in. Leave blank to set
            one later.
          </FormFieldHelperText>
        </FormField>
      ) : null}
      <Switch
        checked={details.enabled}
        disabled={disabled}
        label="Enabled"
        onChange={(event) =>
          onChange({ ...details, enabled: event.target.checked })
        }
      />
    </div>
  );
};
