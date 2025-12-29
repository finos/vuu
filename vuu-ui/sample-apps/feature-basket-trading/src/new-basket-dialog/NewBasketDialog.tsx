import { DataSourceRowObject } from "@vuu-ui/vuu-data-types";
import {
  Prompt,
  TablePicker,
  TablePickerProps,
  VuuInput,
} from "@vuu-ui/vuu-ui-controls";
import { FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, RefCallback, useCallback, useMemo } from "react";
import {
  NewBasketDialogHookProps,
  useNewBasketDialog,
} from "./useNewBasketDialog";

import "./NewBasketDialog.css";

const classBase = "vuuBasketNewBasketDialog";

export interface NewBasketDialogProps
  extends NewBasketDialogHookProps,
    HTMLAttributes<HTMLDivElement> {
  onClose: () => void;
}

/** tags=data-consumer */
export const NewBasketDialog = ({
  className,
  basketSchema,
  onClose,
  onBasketCreated,
  ...htmlAttributes
}: NewBasketDialogProps) => {
  const { onChangeBasketName, onSave, onSelectBasket, confirmButtonProps } =
    useNewBasketDialog({
      basketSchema,
      onBasketCreated,
    });

  const tableProps = useMemo<TablePickerProps["TableProps"]>(
    () => ({
      config: {
        columns: [{ name: "id", hidden: true }, { name: "name" }],
      },
    }),
    [],
  );

  const itemToString = (row: DataSourceRowObject) => row.data.name as string;

  const inputCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  return (
    <Prompt
      {...htmlAttributes}
      className={cx(classBase, className)}
      open
      confirmButtonProps={confirmButtonProps}
      disableAccent
      onClose={onClose}
      onConfirm={onSave}
      showCloseButton={false}
      title="Add New Basket"
    >
      <div className={`${classBase}-body`}>
        <FormField>
          <FormFieldLabel>Basket Name</FormFieldLabel>
          <VuuInput
            bordered
            onCommit={onChangeBasketName}
            ref={inputCallbackRef}
            type="string"
          />
        </FormField>
        <FormField>
          <FormFieldLabel>Basket Definition</FormFieldLabel>
          <TablePicker
            TableProps={tableProps}
            onSelect={onSelectBasket}
            rowToString={itemToString}
            schema={basketSchema}
          />
        </FormField>
      </div>
    </Prompt>
  );
};
