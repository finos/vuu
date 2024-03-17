import {
  DataSource,
  DataSourceRowObject,
  TableSchema,
} from "@finos/vuu-data-types";
import {
  DialogHeader,
  PopupComponent as Popup,
  Portal,
} from "@finos/vuu-popups";
import {
  InstrumentPicker,
  InstrumentPickerProps,
  VuuInput,
} from "@finos/vuu-ui-controls";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, RefCallback, useCallback, useMemo } from "react";
import { useNewBasketPanel } from "./useNewBasketPanel";

import "./NewBasketPanel.css";

const classBase = "vuuBasketNewBasketPanel";

export type BasketCreatedHandler = (
  basketName: string,
  basketId: string,
  instanceId: string
) => void;

export interface NewBasketPanelProps extends HTMLAttributes<HTMLDivElement> {
  basketDataSource: DataSource;
  basketSchema: TableSchema;
  onClose: () => void;
  onBasketCreated: BasketCreatedHandler;
}

const searchColumns = ["name"];

export const NewBasketPanel = ({
  className,
  basketDataSource,
  basketSchema,
  onClose,
  onBasketCreated,
  ...htmlAttributes
}: NewBasketPanelProps) => {
  const {
    columnMap,
    onChangeBasketName,
    onOpenChangeInstrumentPicker,
    onSave,
    onSelectBasket,
    saveButtonDisabled,
    saveButtonRef,
  } = useNewBasketPanel({
    basketDataSource,
    basketSchema,
    onBasketCreated,
  });

  const tableProps = useMemo<InstrumentPickerProps["TableProps"]>(
    () => ({
      config: {
        columns: [
          { name: "id", hidden: true },
          {
            name: "name",
            width: 200,
          },
        ],
        rowSeparators: true,
      },
      dataSource: basketDataSource,
    }),
    [basketDataSource]
  );

  const itemToString = (row: DataSourceRowObject) => row.data.name as string;

  const inputCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
    setTimeout(() => {
      el?.querySelector("input")?.focus();
    }, 100);
  }, []);

  return (
    <Portal>
      <Popup anchorElement={{ current: document.body }} placement="center">
        <div {...htmlAttributes} className={cx(classBase, className)}>
          <DialogHeader
            title="Add New Basket"
            onClose={onClose}
            hideCloseButton
          />
          <div className={`${classBase}-body`}>
            <FormField>
              <FormFieldLabel>Basket Name</FormFieldLabel>
              <VuuInput
                onCommit={onChangeBasketName}
                ref={inputCallbackRef}
                type="string"
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Basket Definition</FormFieldLabel>
              <InstrumentPicker
                TableProps={tableProps}
                columnMap={columnMap}
                itemToString={itemToString}
                onOpenChange={onOpenChangeInstrumentPicker}
                onSelect={onSelectBasket}
                searchColumns={searchColumns}
                schema={basketSchema}
              />
            </FormField>
          </div>
          <div className={`${classBase}-buttonBar`}>
            <Button variant="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={saveButtonDisabled}
              onClick={onSave}
              ref={saveButtonRef}
              variant="cta"
            >
              Save
            </Button>
          </div>
        </div>
      </Popup>
    </Portal>
  );
};
