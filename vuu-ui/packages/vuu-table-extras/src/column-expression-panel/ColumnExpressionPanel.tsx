import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Dropdown } from "@finos/vuu-ui-controls";
import {
  getCalculatedColumnExpression,
  getCalculatedColumnName,
  getCalculatedColumnType,
} from "@finos/vuu-utils";
import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { HTMLAttributes, useCallback, useRef } from "react";
import {
  ColumnExpressionInput,
  ColumnExpressionSubmitHandler,
  useColumnExpressionSuggestionProvider,
} from "../column-expression-input";
import { ColumnSettingsProps } from "../column-settings";
import { useColumnExpression } from "./useColumnExpression";

const classBase = "vuuColumnExpressionPanel";

export interface ColumnExpressionPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<ColumnSettingsProps, "tableConfig" | "vuuTable"> {
  column: ColumnDescriptor;
  /**
   * Callback prop, invoked on every change to calculated column definition
   * @param calculatedColumnName the full calculated column name
   */
  onChangeName?: (name: string) => void;
}

export const ColumnExpressionPanel = ({
  column: columnProp,
  onChangeName: onChangeNameProp,
  tableConfig,
  vuuTable,
}: ColumnExpressionPanelProps) => {
  const typeRef = useRef<HTMLDivElement>(null);
  const { column, onChangeExpression, onChangeName, onChangeType } =
    useColumnExpression({
      column: columnProp,
      onChangeName: onChangeNameProp,
    });
  // The initial value to pass into the Expression Input. That is a
  // CodeMirror editor and will manage its own state once initialised.
  const initialExpressionRef = useRef<string>(
    getCalculatedColumnExpression(column)
  );

  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns: tableConfig.columns,
    table: vuuTable,
  });

  const handleSubmitExpression =
    useCallback<ColumnExpressionSubmitHandler>(() => {
      if (typeRef.current) {
        (
          typeRef.current?.querySelector("button") as HTMLButtonElement
        )?.focus();
      }
    }, []);

  return (
    <div className={classBase}>
      <div className="vuuColumnSettingsPanel-header">
        <span>Calculation</span>
      </div>

      <FormField data-field="column-name">
        <FormFieldLabel>Column Name</FormFieldLabel>
        <Input
          className="vuuInput"
          onChange={onChangeName}
          value={getCalculatedColumnName(column)}
        />
      </FormField>

      <FormField data-field="column-expression">
        <FormFieldLabel>Expression</FormFieldLabel>
        <ColumnExpressionInput
          onChange={onChangeExpression}
          onSubmitExpression={handleSubmitExpression}
          source={initialExpressionRef.current}
          suggestionProvider={suggestionProvider}
        />
      </FormField>
      <FormField data-field="type">
        <FormFieldLabel>Column type</FormFieldLabel>
        <Dropdown
          className={`${classBase}-type`}
          onSelectionChange={onChangeType}
          ref={typeRef}
          selected={getCalculatedColumnType(column) || null}
          source={["double", "long", "string"]}
          width="100%"
        />
      </FormField>
    </div>
  );
};
