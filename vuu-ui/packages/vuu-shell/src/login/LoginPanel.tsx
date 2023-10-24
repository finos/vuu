import { ChangeEvent, HTMLAttributes, useState } from "react";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { VuuLogo } from "./VuuLogo";

import "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  appName?: string;
  onSubmit: (username: string, password: string) => void;
  requirePassword?: boolean;
}

export const LoginPanel = ({
  appName = "Demo App",
  requirePassword = true,
  onSubmit,
}: LoginPanelProps) => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    onSubmit(username, password);
  };

  const handleUsername = (evt: ChangeEvent<HTMLInputElement>) => {
    setUserName(evt.target.value);
  };

  const handlePassword = (evt: ChangeEvent<HTMLInputElement>) => {
    setPassword(evt.target.value);
  };

  const dataIsValid =
    username.trim() !== "" &&
    (requirePassword === false || password.trim() !== "");

  return (
    <div className={classBase}>
      <div className={`${classBase}-branding`}>
        <VuuLogo />
        <div className={`${classBase}-appName`}>{appName}</div>
      </div>
      <div className={`${classBase}-form`}>
        <div className={`${classBase}-title`}>Welcome Back</div>
        <FormField>
          <FormFieldLabel>Username</FormFieldLabel>
          <Input
            value={username}
            id="text-username"
            onChange={handleUsername}
          />
        </FormField>

        {requirePassword ? (
          <FormField>
            <FormFieldLabel>Password</FormFieldLabel>
            <Input
              className={`${classBase}-password`}
              inputProps={{
                type: "password",
              }}
              value={password}
              id="text-password"
              onChange={handlePassword}
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
