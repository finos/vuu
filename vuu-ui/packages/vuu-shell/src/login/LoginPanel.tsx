import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  ChangeEvent,
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { VuuLogo } from "./VuuLogo";

import loginPanelCss from "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  appName?: string;
  onSubmit: (username: string, password: string) => void;
}

export const LoginPanel = ({
  appName = "Demo App",
  className,
  onSubmit,
  ...htmlAttributes
}: LoginPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-login-panel",
    css: loginPanelCss,
    window: targetWindow,
  });

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
    if (password) {
      onSubmit(username, password);
    }
  }, [onSubmit, password, username]);

  const handleCommitPassword = useCallback(() => {
    if (username) {
      onSubmit(username, password);
    }
  }, [onSubmit, password, username]);

  const dataIsValid = username.trim() !== "" && password.trim() !== "";

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

        <Button
          appearance="solid"
          className={`${classBase}-login`}
          disabled={!dataIsValid}
          onClick={login}
          sentiment="accented"
        >
          Login
        </Button>
      </div>
    </div>
  );
};
