import { ExpandoInput } from "@finos/vuu-ui-controls";
import { ChangeEvent, useCallback, useState } from "react";

let displaySequence = 1;

export const DefaultExpandoInput = () => {
  const [value, setValuue] = useState("Enter value");

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    const target = evt.target as HTMLInputElement;
    setValuue(target.value);
  }, []);

  return <ExpandoInput onChange={handleChange} value={value} />;
};
DefaultExpandoInput.displaySequence = displaySequence++;
