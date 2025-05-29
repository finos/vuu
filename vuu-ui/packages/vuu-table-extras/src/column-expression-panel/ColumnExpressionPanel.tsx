import { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor, ColumnSettingsProps } from "@vuu-ui/vuu-table-types";
import { getCalculatedColumnDetails } from "@vuu-ui/vuu-utils";
import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";
import { HTMLAttributes, useCallback, useRef } from "react";
import {
  ColumnExpressionInput,
  ColumnExpressionSubmitHandler,
  useColumnExpressionSuggestionProvider,
} from "../column-expression-input";
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
  onChangeServerDataType?: (name: VuuColumnDataType) => void;
}

export const ColumnExpressionPanel = ({
  column: columnProp,
  onChangeName: onChangeNameProp,
  onChangeServerDataType: onChangeServerDataTypeProp,
  tableConfig,
  vuuTable,
}: ColumnExpressionPanelProps) => {
  const typeRef = useRef<HTMLButtonElement>(null);
  const { column, onChangeExpression, onChangeName, onChangeServerDataType } =
    useColumnExpression({
      column: columnProp,
      onChangeName: onChangeNameProp,
      onChangeServerDataType: onChangeServerDataTypeProp,
    });
  // The initial value to pass into the Expression Input. That is a
  // CodeMirror editor and will manage its own state once initialised.
  const initialExpressionRef = useRef<string>(
    getCalculatedColumnDetails(column).expression ?? "",
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

  const { name, serverDataType } = getCalculatedColumnDetails(column);

  return (
    <div className={classBase}>
      <div className="vuuColumnSettingsPanel-header">
        <span>Calculation</span>
      </div>

      <FormField data-field="column-name">
        <FormFieldLabel>Column Name</FormFieldLabel>
        <Input className="vuuInput" onChange={onChangeName} value={name} />
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
          onSelectionChange={onChangeServerDataType}
          ref={typeRef}
          selected={serverDataType ? [serverDataType] : []}
          value={serverDataType}
        >
          <Option value="boolean">Boolean</Option>
          <Option value="double">Double</Option>
          <Option value="long">Long</Option>
          <Option value="string">String</Option>
        </Dropdown>
      </FormField>
    </div>
  );
};
