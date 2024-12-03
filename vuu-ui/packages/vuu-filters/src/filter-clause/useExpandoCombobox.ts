import { ChangeEvent, SyntheticEvent, useState } from "react";

export const useExpandoComboBox = ({
  onSelect,
  value: valueProp,
}: {
  onSelect: (evt: SyntheticEvent, columnName: string) => void;
  value: string;
}) => {
  const [value, setValue] = useState(valueProp);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(value);
  };

  const handleSelectionChange = (
    evt: SyntheticEvent,
    newSelected: string[],
  ) => {
    onSelect?.(evt, newSelected[0]);
  };

  return {
    onChange: handleChange,
    onSelectionChange: handleSelectionChange,
    value: value.toString().trim(),
  };
};
