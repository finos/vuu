import React, { useState } from "react";
import { TextInput } from "@vuu-ui/ui-controls";
import { Button } from "@heswell/uitk-core";

import "./LoginPanel.css";

const classBase = "vuuLoginPanel";

export const LoginPanel = ({ onSubmit }) => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    onSubmit(username, password);
  };

  const handleUsername = (value) => {
    setUserName(value);
  };

  const handlePassword = (value) => {
    setPassword(value);
  };

  return (
    <div className={classBase}>
      <label htmlFor="txt-username">User Id</label>
      <TextInput
        defaultValue={username}
        id="text-username"
        onCommit={handleUsername}
      />
      <label htmlFor="txt-password">Password</label>
      <TextInput
        defaultValue={password}
        id="text-password"
        type="password"
        onCommit={handlePassword}
      />
      <Button className={`${classBase}-login`} onClick={login}>
        Login
      </Button>
    </div>
  );
};
