import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import { type FormEvent, type SyntheticEvent, useState } from "react";

/** A Vuu server entered by the user rather than referenced by a module. */
export type ManualServer = {
  connectionId: string;
  restUrl: string;
  websocketUrl: string;
};

type Field = keyof ManualServer;
type FieldErrors = Partial<Record<Field, string>>;

const EMPTY_SERVER: ManualServer = {
  connectionId: "",
  restUrl: "",
  websocketUrl: "",
};

const hasProtocol = (value: string, protocols: string[], base?: string) => {
  try {
    return protocols.includes(new URL(value, base).protocol);
  } catch {
    return false;
  }
};

export const validateManualServer = (
  server: ManualServer,
  existingIds: ReadonlySet<string>,
): FieldErrors => {
  const errors: FieldErrors = {};
  if (!server.connectionId) {
    errors.connectionId = "Enter a name for the server";
  } else if (existingIds.has(server.connectionId)) {
    errors.connectionId = "A server with this name is already listed";
  }
  if (!hasProtocol(server.websocketUrl, ["ws:", "wss:"])) {
    errors.websocketUrl = "Enter a ws:// or wss:// URL";
  }
  // Relative URLs resolve against the page, e.g. a proxied authn endpoint.
  if (
    !server.restUrl ||
    !hasProtocol(server.restUrl, ["http:", "https:"], document.baseURI)
  ) {
    errors.restUrl = "Enter an http:// or https:// URL";
  }
  return errors;
};

const FIELDS: { field: Field; label: string; placeholder: string }[] = [
  { field: "connectionId", label: "Name", placeholder: "my-server" },
  {
    field: "websocketUrl",
    label: "WebSocket URL",
    placeholder: "wss://host:8090/websocket",
  },
  {
    field: "restUrl",
    label: "Authentication URL",
    placeholder: "https://host:8443/api/authn",
  },
];

export const AddServerForm = ({
  existingIds,
  onAdd,
  onCancel,
}: {
  existingIds: ReadonlySet<string>;
  onAdd: (server: ManualServer) => void;
  onCancel: () => void;
}) => {
  const [values, setValues] = useState<ManualServer>(EMPTY_SERVER);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const server: ManualServer = {
      connectionId: values.connectionId.trim(),
      restUrl: values.restUrl.trim(),
      websocketUrl: values.websocketUrl.trim(),
    };
    const nextErrors = validateManualServer(server, existingIds);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onAdd(server);
    }
  };

  const handleChange = (field: Field) => (event: SyntheticEvent) => {
    const { value } = event.target as HTMLInputElement;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _, ...rest }) => rest);
  };

  return (
    <form
      aria-label="Add Vuu server"
      className="vuuTableBrowser-add-server"
      noValidate
      onSubmit={handleSubmit}
    >
      {FIELDS.map(({ field, label, placeholder }) => (
        <FormField
          key={field}
          validationStatus={errors[field] ? "error" : undefined}
        >
          <FormFieldLabel>{label}</FormFieldLabel>
          <Input
            inputProps={{ name: field }}
            onChange={handleChange(field)}
            placeholder={placeholder}
            value={values[field]}
          />
          {errors[field] ? (
            <FormFieldHelperText>{errors[field]}</FormFieldHelperText>
          ) : null}
        </FormField>
      ))}
      <div className="vuuTableBrowser-add-server-actions">
        <Button appearance="transparent" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button sentiment="accented" type="submit">
          Add
        </Button>
      </div>
    </form>
  );
};
