import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@salt-ds/core";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { CommitHandler, getVuuTable } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useTypeaheadSuggestions } from "@vuu-ui/vuu-data-react";
import { TypeaheadParams } from "@vuu-ui/vuu-protocol-types";
import { useMemo, useState } from "react";

export interface ToggleFilterProps extends ToggleButtonGroupProps {
  column: string;
  onCommit: CommitHandler<HTMLElement>;
  table: TableSchemaTable;
  values: string[];
}

const classBase = "vuuToggleFilter";

export const ToggleFilter = ({
  className,
  column,
  onCommit,
  table,
  values,
  ...ToggleButtonGroupProps
}: ToggleFilterProps) => {
  const [typeaheadValues, setTypeaheadValues] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();

  console.log({ typeaheadValues });

  useMemo(() => {
    const vuuTable = getVuuTable(table);
    const params: TypeaheadParams = [vuuTable, column];
    getSuggestions(params).then((suggestions) => {
      if (suggestions === false) {
        // TODO is this right
        setTypeaheadValues([]);
      } else {
        setTypeaheadValues(suggestions);
      }
    });
  }, [column, getSuggestions, table]);

  return (
    <ToggleButtonGroup
      {...ToggleButtonGroupProps}
      className={cx(classBase, className)}
    >
      <ToggleButton key="all" value="all">
        ALL
      </ToggleButton>
      {values.map((value) => (
        <ToggleButton
          key={value}
          value={value}
          disabled={!typeaheadValues.includes(value) && value === "all"}
        >
          {value}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
