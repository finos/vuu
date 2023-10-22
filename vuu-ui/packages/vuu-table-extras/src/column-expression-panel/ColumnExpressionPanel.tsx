import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Dropdown } from "@finos/vuu-ui-controls";
import {
  getCalculatedColumnExpression,
  getCalculatedColumnName,
  getCalculatedColumnType,
} from "@finos/vuu-utils";
import { Button, FormField, FormFieldLabel, Input } from "@salt-ds/core";
import { HTMLAttributes, useCallback, useRef } from "react";
import {
  ColumnExpressionInput,
  useColumnExpressionSuggestionProvider,
} from "../column-expression-input";
import { ColumnSettingsProps } from "../column-settings";
import { useColumnExpression } from "./useColumnExpression";

const classBase = "vuuColumnExpressionPanel";

export interface ColumnExpressionPanelProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<ColumnSettingsProps, "tableConfig" | "vuuTable"> {
  column: ColumnDescriptor;
  onChangeName?: (name: string) => void;
  onSave: (column: ColumnDescriptor) => void;
}

export const ColumnExpressionPanel = ({
  column: columnProp,
  onChangeName: onChangeNameProp,
  onSave: onSaveProp,
  tableConfig,
  vuuTable,
}: ColumnExpressionPanelProps) => {
  const typeRef = useRef<HTMLDivElement>(null);
  const { column, onChangeExpression, onChangeName, onChangeType, onSave } =
    useColumnExpression({
      column: columnProp,
      onChangeName: onChangeNameProp,
      onSave: onSaveProp,
    });
  const expressionRef = useRef<string>(getCalculatedColumnExpression(column));

  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns: tableConfig.columns,
    table: vuuTable,
  });

  const handleSubmitExpression = useCallback(() => {
    requestAnimationFrame(() => {
      typeRef.current?.querySelector("button")?.focus();
    });
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
          // onKeyDown={onKeyDownColumnName}
          value={getCalculatedColumnName(column)}
        />
      </FormField>

      <FormField data-field="column-expression">
        <FormFieldLabel>Expression</FormFieldLabel>
        <ColumnExpressionInput
          onChange={onChangeExpression}
          onSubmitExpression={handleSubmitExpression}
          source={expressionRef.current}
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

      <div className="vuuColumnSettingsPanel-buttonBar" data-align="right">
        <Button className={`${classBase}-buttonCancel`} tabIndex={-1}>
          cancel
        </Button>
        <Button className={`${classBase}-buttonApply`} tabIndex={-1}>
          apply
        </Button>
        <Button
          className={`${classBase}-buttonSave`}
          onClick={onSave}
          variant="cta"
        >
          save
        </Button>
      </div>
    </div>
  );
};
