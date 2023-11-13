import { DataSource, TableSchema } from "@finos/vuu-data";
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
import cx from "classnames";
import { DataSourceRow } from "@finos/vuu-data-types";
import { HTMLAttributes, useMemo } from "react";

import "./NewBasketPanel.css";
import { useNewBasketPanel } from "./useNewBasketPanel";

const classBase = "vuuBasketNewBasketPanel";

const displayName = (key: number) => (row: DataSourceRow) => String(row[key]);

export interface NewBasketPanelProps extends HTMLAttributes<HTMLDivElement> {
  basketDataSource: DataSource;
  basketSchema: TableSchema;
  onClose: () => void;
  onSaveBasket: (basketName: string, basketId: string) => void;
}

const searchColumns = ["name"];

export const NewBasketPanel = ({
  className,
  basketDataSource,
  basketSchema,
  onClose,
  onSaveBasket,
  ...htmlAttributes
}: NewBasketPanelProps) => {
  const {
    columnMap,
    onChangeBasketName,
    onOpenChangeInstrumentPicker,
    onSave,
    onSelectBasket,
    saveButtonDisabled,
  } = useNewBasketPanel({
    basketDataSource,
    basketSchema,
    onSaveBasket,
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

  const itemToString = displayName(columnMap.name);

  return (
    <Portal>
      <Popup anchorElement={{ current: document.body }} placement="center">
        <div {...htmlAttributes} className={cx(classBase, className)}>
          <DialogHeader title="Add New Basket" onClose={onClose} />
          <div className={`${classBase}-body`}>
            <FormField>
              <FormFieldLabel>Basket Name</FormFieldLabel>
              <VuuInput onCommit={onChangeBasketName} type="string" />
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
              variant="cta"
              disabled={saveButtonDisabled}
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </div>
      </Popup>
    </Portal>
  );
};
