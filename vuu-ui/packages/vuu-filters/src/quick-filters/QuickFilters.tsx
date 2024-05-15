import { Icon } from "@finos/vuu-ui-controls";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ColumnDescriptor } from "packages/vuu-table-types";
import { HTMLAttributes } from "react";
import { useQuickFilters } from "./useQuickFilters";

import quickFiltersCss from "./QuickFilters.css";

const classBase = "vuuQuickFilters";

export interface QuickFilterProps extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDescriptor[];
}

export const QuickFilters = ({ columns }: QuickFilterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-quick-filters",
    css: quickFiltersCss,
    window: targetWindow,
  });

  const searchIcon = <Icon name="search" size={18} />;

  const { onChange } = useQuickFilters();

  return (
    <div className={classBase}>
      <FormField>
        <FormFieldLabel>Find</FormFieldLabel>
        <Input
          inputProps={{
            onChange,
          }}
          startAdornment={searchIcon}
          variant="secondary"
        />
      </FormField>
      {columns.map((column) => (
        <FormField key={column.name}>
          <FormFieldLabel>{column.name}</FormFieldLabel>
          <Input variant="secondary" />
        </FormField>
      ))}
    </div>
  );
};
