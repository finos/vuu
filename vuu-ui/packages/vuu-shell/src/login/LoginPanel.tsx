import { ChangeEvent, HTMLAttributes, useState } from "react";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";

import "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  onSubmit: (username: string, password: string) => void;
  requirePassword?: boolean;
}

export const LoginPanel = ({
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
      <FormField style={{ width: 200 }}>
        <FormFieldLabel>Username</FormFieldLabel>
        <Input value={username} id="text-username" onChange={handleUsername} />
      </FormField>

      {requirePassword ? (
        <FormField style={{ width: 200 }}>
          <FormFieldLabel>Password</FormFieldLabel>
          <Input
            inputProps={{
              type: "password",
            }}
            value={password}
            id="text-password"
            onChange={handlePassword}
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
  );
};
