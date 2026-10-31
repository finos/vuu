import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  RadioButton,
  RadioButtonGroup,
} from "@salt-ds/core";
import type { VuuServerAuthMode } from "@vuu-ui/vuu-data-types";
import {
  type ChangeEvent,
  type FormEvent,
  type SyntheticEvent,
  useState,
} from "react";

import type { VuuServerCredentials } from "../auth/VuuServerLogin";
import type { ManualVuuServer } from "./ManualVuuServers";

type ManualServer = ManualVuuServer;
type TextField = "connectionId" | "restUrl" | "username" | "websocketUrl";
export type ManualServerErrors = Partial<Record<TextField, string>>;

interface FormValues {
  auth: VuuServerAuthMode;
  connectionId: string;
  password: string;
  restUrl: string;
  username: string;
  websocketUrl: string;
}

const EMPTY_VALUES: FormValues = {
  auth: "token-exchange",
  connectionId: "",
  password: "",
  restUrl: "",
  username: "",
  websocketUrl: "",
};

export const INVALID_WEBSOCKET_URL_MESSAGE =
  "Enter a WebSocket URL (wss or ws)";
export const INVALID_AUTH_URL_MESSAGE =
  "Enter an authentication URL (https or http)";
export const MISSING_USERNAME_MESSAGE = "Enter the username to sign in with";

const hasProtocol = (value: string, protocols: string[], base?: string) => {
  try {
    return protocols.includes(new URL(value, base).protocol);
  } catch {
    return false;
  }
};

/**
 * Checks a server entered by the user: a unique name, a websocket URL, an
 * authentication URL and, for `vuu-login`, a username. Returns an error
 * message per invalid field.
 */
export const validateManualServer = (
  server: ManualServer,
  existingIds: ReadonlySet<string>,
): ManualServerErrors => {
  const errors: ManualServerErrors = {};
  if (!server.connectionId) {
    errors.connectionId = "Enter a name for the server";
  } else if (existingIds.has(server.connectionId)) {
    errors.connectionId = "A server with this name is already listed";
  }
  if (!hasProtocol(server.websocketUrl, ["ws:", "wss:"])) {
    errors.websocketUrl = INVALID_WEBSOCKET_URL_MESSAGE;
  }
  // Relative URLs resolve against the page, e.g. a proxied authn endpoint.
  if (
    !server.restUrl ||
    !hasProtocol(server.restUrl, ["http:", "https:"], document.baseURI)
  ) {
    errors.restUrl = INVALID_AUTH_URL_MESSAGE;
  }
  if (server.auth === "vuu-login" && !server.username) {
    errors.username = MISSING_USERNAME_MESSAGE;
  }
  return errors;
};

const AUTH_OPTIONS: { label: string; value: VuuServerAuthMode }[] = [
  { label: "Portal sign-in (token exchange)", value: "token-exchange" },
  { label: "Vuu login (username and password)", value: "vuu-login" },
];

const AUTH_URL_HELP: Record<VuuServerAuthMode, string> = {
  "token-exchange": "Exchanges your portal sign-in for a Vuu token",
  "vuu-login": "The Vuu server's login endpoint",
};

export interface AddServerFormProps {
  /** Names already in use. */
  existingIds: ReadonlySet<string>;
  /** `credentials` are present for a server that uses `vuu-login`. */
  onAdd: (server: ManualVuuServer, credentials?: VuuServerCredentials) => void;
  onCancel: () => void;
}

/**
 * Name, websocket URL, authentication URL and authentication method of a
 * Vuu server to add.
 */
export const AddServerForm = ({
  existingIds,
  onAdd,
  onCancel,
}: AddServerFormProps) => {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ManualServerErrors>({});
  const vuuLogin = values.auth === "vuu-login";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const username = values.username.trim();
    const server: ManualServer = {
      connectionId: values.connectionId.trim(),
      restUrl: values.restUrl.trim(),
      websocketUrl: values.websocketUrl.trim(),
      ...(vuuLogin ? { auth: "vuu-login", username } : {}),
    };
    const nextErrors = validateManualServer(server, existingIds);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onAdd(
        server,
        vuuLogin ? { password: values.password, username } : undefined,
      );
    }
  };

  const handleChange =
    (field: TextField | "password") => (event: SyntheticEvent) => {
      const { value } = event.target as HTMLInputElement;
      setValues((current) => ({ ...current, [field]: value }));
      setErrors(({ [field as TextField]: _, ...rest }) => rest);
    };

  const handleAuthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const auth = event.target.value as VuuServerAuthMode;
    setValues((current) => ({ ...current, auth }));
    setErrors(({ username: _, ...rest }) => rest);
  };

  const textField = (
    field: TextField | "password",
    label: string,
    placeholder?: string,
    helperText?: string,
  ) => {
    const error = field === "password" ? undefined : errors[field];
    return (
      <FormField key={field} validationStatus={error ? "error" : undefined}>
        <FormFieldLabel>{label}</FormFieldLabel>
        <Input
          inputProps={{
            autoComplete: field === "password" ? "current-password" : "off",
            name: field,
            type: field === "password" ? "password" : "text",
          }}
          onChange={handleChange(field)}
          placeholder={placeholder}
          value={values[field]}
        />
        {error || helperText ? (
          <FormFieldHelperText>{error ?? helperText}</FormFieldHelperText>
        ) : null}
      </FormField>
    );
  };

  return (
    <form
      aria-label="Add Vuu server"
      className="vuuAddServerForm"
      noValidate
      onSubmit={handleSubmit}
    >
      {textField("connectionId", "Name", "my-server")}
      {textField("websocketUrl", "WebSocket URL", "wss://host:8090/websocket")}
      <FormField>
        <FormFieldLabel>Authentication</FormFieldLabel>
        <RadioButtonGroup
          name="auth"
          onChange={handleAuthChange}
          value={values.auth}
        >
          {AUTH_OPTIONS.map(({ label, value }) => (
            <RadioButton key={value} label={label} value={value} />
          ))}
        </RadioButtonGroup>
      </FormField>
      {textField(
        "restUrl",
        "Authentication URL",
        "https://host:8443/api/authn",
        AUTH_URL_HELP[values.auth],
      )}
      {vuuLogin ? (
        <>
          {textField("username", "Username")}
          {textField(
            "password",
            "Password",
            undefined,
            "Kept until you close this tab",
          )}
        </>
      ) : null}
      <div className="vuuAddServerForm-actions">
        <Button appearance="transparent" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button sentiment="accented" type="submit">
          {vuuLogin ? "Add and sign in" : "Add"}
        </Button>
      </div>
    </form>
  );
};
