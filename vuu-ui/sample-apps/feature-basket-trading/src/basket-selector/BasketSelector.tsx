import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
// import { VuuDataRow } from "packages/vuu-protocol-types";
import { DataSource, SubscribeCallback } from "@finos/vuu-data";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import { InstrumentSearch } from "@finos/vuu-ui-controls";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { HTMLAttributes, useCallback, useMemo, useRef, useState } from "react";
import { PopupComponent as Popup, Portal } from "@finos/vuu-popups";
import { TableProps } from "@finos/vuu-table";

import "./BasketSelector.css";

const classBase = "vuuBasketSelector";

export interface BasketSelectorProps extends HTMLAttributes<HTMLDivElement> {
  basketId?: string;
  dataSourceBasket: DataSource;
  dataSourceBasketSearch: DataSource;
  label?: string;
}

export class Basket {
  currency: string;
  exchangeRateToUSD: number;
  name: string;
  symbolName: string;

  constructor(data: VuuDataRow, columnMap: ColumnMap) {
    console.log(data.slice(8).join(","));
    this.currency = data[columnMap.currency] as string;
    this.exchangeRateToUSD = data[columnMap.exchangeRateToUSD] as number;
    this.name = data[columnMap.name] as string;
    this.symbolName = data[columnMap.symbolName] as string;
  }
}

export const BasketSelector = ({
  basketId,
  dataSourceBasket,
  dataSourceBasketSearch,
  ...htmlAttributes
}: BasketSelectorProps) => {
  // const [basket, setBasket] = useState<Basket | undefined>(new Basket());
  const rootRef = useRef<HTMLDivElement>(null);
  const columnMap = useMemo(() => buildColumnMap(dataSourceBasket.columns), []);
  const [open, setOpen] = useState(false);
  const [basket, setBasket] = useState<Basket | undefined>();

  const handleData = useCallback<SubscribeCallback>(
    (message) => {
      console.log(message);
      if (message.type === "viewport-update" && message.rows?.length === 1) {
        console.log("create a new basket");
        setBasket(new Basket(message.rows[0], columnMap));
      }
    },
    [columnMap]
  );

  const toggleSearch = useCallback(() => {
    setOpen((open) => !open);
  }, []);

  useMemo(() => {
    dataSourceBasket.subscribe(
      {
        filter: { filter: `id = "${basketId}"` },
        range: { from: 0, to: 1 },
      },
      handleData
    );
  }, [basketId, dataSourceBasket, handleData]);

  const tableProps: Partial<TableProps> = {
    config: {
      columns: [
        { name: "id", hidden: true },
        {
          name: "name",
          width: 200,
          type: {
            name: "string",
            renderer: {
              name: "search-cell",
            },
          },
        },
        {
          name: "symbolName",
          width: 100,
          type: {
            name: "string",
          },
        },
      ],
    },
  };

  return (
    <div {...htmlAttributes} className={classBase} ref={rootRef}>
      <FormField>
        <FormFieldLabel>Basket Name</FormFieldLabel>
        <span className={`${classBase}-basketName`}>{basket?.name}</span>
      </FormField>
      <FormField>
        <FormFieldLabel>Symbol</FormFieldLabel>
        <span className={`${classBase}-symbolName`}>{basket?.symbolName}</span>
      </FormField>
      <FormField>
        <FormFieldLabel>GBP to USD</FormFieldLabel>
        <span className={`${classBase}-symbolName`}>
          {basket?.exchangeRateToUSD}
        </span>
      </FormField>
      <Button
        className={`${classBase}-trigger`}
        data-icon="chevron-down"
        onClick={toggleSearch}
      />
      <Portal open={open}>
        <Popup anchorElement={rootRef} placement="below">
          <div className={`${classBase}-searchContainer`}>
            <InstrumentSearch
              TableProps={tableProps}
              dataSource={dataSourceBasketSearch}
            />
          </div>
        </Popup>
      </Portal>
    </div>
  );
};
