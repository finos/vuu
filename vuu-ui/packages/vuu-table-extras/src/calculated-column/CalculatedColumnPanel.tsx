import {
  Dropdown,
  FormField,
  FormFieldLabel,
  Input,
  Option,
} from "@salt-ds/core";
import { useCalculatedColumnPanel } from "./useCalculatedColumnPanel";
import { HTMLAttributes, useCallback, useRef } from "react";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { VuuColumnDataType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { getCalculatedColumnDetails } from "@vuu-ui/vuu-utils";
import {
  ColumnExpressionInput,
  ColumnExpressionSubmitHandler,
  useColumnExpressionSuggestionProvider,
} from "../column-expression-input";
import { ColumnModel } from "../column-picker/ColumnModel";

const classBase = "vuuCalculatedColumnPanel";

export interface CalculatedColumnPanelProps
  extends HTMLAttributes<HTMLDivElement> {
  column: ColumnDescriptor;
  columnModel: ColumnModel;
  onChangeColumn: (column: ColumnDescriptor) => void;
  onChangeServerDataType?: (name: VuuColumnDataType) => void;
  vuuTable: VuuTable;
}

export const CalculatedColumnPanel = ({
  column: columnProp,
  columnModel,
  onChangeColumn,
  onChangeServerDataType: onChangeServerDataTypeProp,
  vuuTable,
}: CalculatedColumnPanelProps) => {
  const typeRef = useRef<HTMLButtonElement>(null);

  const { column, onChangeExpression, onChangeName, onChangeServerDataType } =
    useCalculatedColumnPanel({
      column: columnProp,
      onChangeColumn,
      onChangeServerDataType: onChangeServerDataTypeProp,
    });
  // The initial value to pass into the Expression Input. That is a
  // CodeMirror editor and will manage its own state once initialised.
  const initialExpressionRef = useRef<string>(
    getCalculatedColumnDetails(column).expression ?? "",
  );

  const suggestionProvider = useColumnExpressionSuggestionProvider({
    columns: columnModel.selectedColumns,
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
      <div>{column.name}</div>

      <FormField data-field="column-name">
        <FormFieldLabel>Column Label</FormFieldLabel>
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
