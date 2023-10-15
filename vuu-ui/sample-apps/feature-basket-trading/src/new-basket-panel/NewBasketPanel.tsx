import { DataSource, TableSchema } from "@finos/vuu-data";
import {
  DialogHeader,
  PopupComponent as Popup,
  Portal,
} from "@finos/vuu-popups";
import { TableRowSelectHandler } from "@finos/vuu-table";
import {
  Commithandler,
  InstrumentPicker,
  InstrumentPickerProps,
  VuuInput,
} from "@finos/vuu-ui-controls";
import { buildColumnMap } from "@finos/vuu-utils";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes, useCallback, useMemo, useState } from "react";

import "./NewBasketPanel.css";

const classBase = "vuuBasketNewBasketPanel";

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
  console.log(`dataSource size ${basketDataSource.size}`, {
    basketDataSource,
  });
  const tableProps = useMemo<InstrumentPickerProps["TableProps"]>(
    () => ({
      config: {
        columns: [
          { name: "ID", hidden: true },
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
  const [basketName, setBasketName] = useState("");
  const [basketId, setBasketId] = useState<string>();

  const columnMap = buildColumnMap(basketSchema.columns);

  const handleChangeBasketName = useCallback<Commithandler<string>>(
    (evt, value) => {
      setBasketName(value);
    },
    []
  );

  const handleSelectBasket = useCallback<TableRowSelectHandler>(
    (row) => {
      const { ID } = columnMap;
      const basketId = row[ID] as string;
      setBasketId(basketId);
    },
    [columnMap]
  );

  const saveBasket = useCallback(() => {
    if (basketName && basketId) {
      onSaveBasket(basketName, basketId);
    }
  }, [basketId, basketName, onSaveBasket]);

  const disableSave = basketName === "" || basketId === undefined;

  return (
    <Portal>
      <Popup anchorElement={{ current: document.body }} placement="center">
        <div {...htmlAttributes} className={cx(classBase, className)}>
          <DialogHeader title="Add New Basket" onClose={onClose} />
          <div className={`${classBase}-body`}>
            <FormField>
              <FormFieldLabel>Basket Name</FormFieldLabel>
              <VuuInput onCommit={handleChangeBasketName} type="string" />
            </FormField>
            <FormField>
              <FormFieldLabel>Basket Definition</FormFieldLabel>
              <InstrumentPicker
                columnMap={columnMap}
                onSelect={handleSelectBasket}
                searchColumns={searchColumns}
                TableProps={tableProps}
                schema={basketSchema}
              />
            </FormField>
          </div>
        </div>
        <div className={`${classBase}-buttonBar`}>
          <Button variant="primary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="cta" disabled={disableSave} onClick={saveBasket}>
            Save
          </Button>
        </div>
      </Popup>
    </Portal>
  );
};
