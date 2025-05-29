import { ExpandoInput } from "@vuu-ui/vuu-ui-controls";
import { Input } from "@salt-ds/core";
import { ChangeEvent, ReactNode, useCallback, useState } from "react";

const ExpandoContainer = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignItems: "center",
      border: "solid 1px black",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      width: 300,
    }}
  >
    <Input />
    {children}
    <Input />
  </div>
);

export const DefaultExpandoInput = () => {
  const [value, setValue] = useState("Initial value");

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    const target = evt.target as HTMLInputElement;
    setValue(target.value);
  }, []);

  return (
    <ExpandoContainer>
      <ExpandoInput onChange={handleChange} value={value} />
    </ExpandoContainer>
  );
};
