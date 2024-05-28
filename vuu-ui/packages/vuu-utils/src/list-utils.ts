import type { ListOption } from "@finos/vuu-table-types";

export const getSelectedOption = (
  values: ListOption[],
  selectedValue: string | number | undefined
) => {
  if (selectedValue === undefined) {
    return undefined;
  }
  return values.find((option) => option.value === selectedValue);
};
