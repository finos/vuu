import {
  ChangeEvent,
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { VuuInput } from "@finos/vuu-ui-controls";
import { VuuLogo } from "./VuuLogo";
import cx from "classnames";

import "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  appName?: string;
  onSubmit: (username: string, password?: string) => void;
  requirePassword?: boolean;
}

export const LoginPanel = ({
  appName = "Demo App",
  className,
  requirePassword = true,
  onSubmit,
  ...htmlAttributes
}: LoginPanelProps) => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const login = () => {
    onSubmit(username, password);
  };

  const handleUsername = (evt: ChangeEvent<HTMLInputElement>) => {
    setUserName(evt.target.value);
  };

  const handlePassword = (evt: ChangeEvent<HTMLInputElement>) => {
    setPassword(evt.target.value);
  };

  const handleCommitName = useCallback(() => {
    if (!requirePassword) {
      onSubmit(username);
    }
  }, [onSubmit, requirePassword, username]);

  const handleCommitPassword = useCallback(() => {
    if (username) {
      onSubmit(username, password);
    }
  }, [onSubmit, password, username]);

  const dataIsValid =
    username.trim() !== "" &&
    (requirePassword === false || password.trim() !== "");

  useEffect(() => {
    console.log(`inputRef`, {
      input: inputRef.current,
    });
    inputRef.current?.focus();
  }, []);

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <div className={`${classBase}-branding`}>
        <VuuLogo />
        <div className={`${classBase}-appName`}>{appName}</div>
      </div>
      <div className={`${classBase}-form`}>
        <div className={`${classBase}-title`}>Welcome Back</div>
        <FormField>
          <FormFieldLabel>Username</FormFieldLabel>
          <VuuInput
            value={username}
            id="text-username"
            inputRef={inputRef}
            onChange={handleUsername}
            onCommit={handleCommitName}
          />
        </FormField>

        {requirePassword ? (
          <FormField>
            <FormFieldLabel>Password</FormFieldLabel>
            <VuuInput
              className={`${classBase}-password`}
              inputProps={{
                type: "password",
              }}
              value={password}
              id="text-password"
              onChange={handlePassword}
              onCommit={handleCommitPassword}
              endAdornment={
                <span data-icon="eye" style={{ cursor: "pointer" }} />
              }
            />
          </FormField>
        ) : null}

        <Button
          className={`${classBase}-login`}
          disabled={!dataIsValid}
          onClick={login}
          variant="cta"
        >
          Login
        </Button>
      </div>
    </div>
  );
};
