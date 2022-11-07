import { ChangeEvent, HTMLAttributes, useState } from "react";
import { Button } from "@heswell/uitk-core";
import { FormField, Input } from "@heswell/uitk-core";

import "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export interface LoginPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  onSubmit: (username: string, password: string) => void;
}

export const LoginPanel = ({ onSubmit }: LoginPanelProps) => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    onSubmit(username, password);
  };

  const handleUsername = (
    _event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    setUserName(value);
  };

  const handlePassword = (
    _event: ChangeEvent<HTMLInputElement>,
    value: string
  ) => {
    setPassword(value);
  };

  const dataIsValid = username.trim() !== "" && password.trim() !== "";

  return (
    <div className={classBase}>
      <FormField label="Username" style={{ width: 200 }}>
        <Input value={username} id="text-username" onChange={handleUsername} />
      </FormField>

      <FormField label="Password" style={{ width: 200 }}>
        <Input
          type="password"
          value={password}
          id="text-password"
          onChange={handlePassword}
        />
      </FormField>

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
