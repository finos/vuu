import type { LookupTableDetails } from "@vuu-ui/vuu-table-types";
import type { CommitHandler } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import {
  type OptionMap,
  useLookupValues,
} from "../lookup-values/useLookupValues";
import { EditControlDropdown } from "./EditControlDropdown";

export interface EditControlLookupDropdownProps {
  className?: string;
  lookup: LookupTableDetails;
  onCommit: CommitHandler<HTMLElement>;
  value?: unknown;
}

/**
 * A dropdown offering the values of a lookup table, labelled with its
 * `labelColumn`. Commits the `valueColumn` value of the selected row.
 */
export const EditControlLookupDropdown = ({
  className,
  lookup: { labelColumn, table, valueColumn },
  onCommit,
  value,
}: EditControlLookupDropdownProps) => {
  const optionMap = useMemo<OptionMap>(
    () => ({ label: labelColumn, value: valueColumn }),
    [labelColumn, valueColumn],
  );
  const lookupValues = useLookupValues({ enabled: true, optionMap, table });
  const values = useMemo(
    () =>
      lookupValues.map(({ label, value }) => ({ label, value: String(value) })),
    [lookupValues],
  );
  return (
    <EditControlDropdown
      className={className}
      onCommit={onCommit}
      value={value}
      values={values}
    />
  );
};
