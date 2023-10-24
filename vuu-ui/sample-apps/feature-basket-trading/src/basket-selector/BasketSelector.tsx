import { PriceTicker } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { DataSource, SubscribeCallback } from "@finos/vuu-data";
import { useId } from "@finos/vuu-layout";
import { PopupComponent as Popup, Portal } from "@finos/vuu-popups";
import { VuuDataRow } from "@finos/vuu-protocol-types";
import { TableProps, TableRowClickHandler } from "@finos/vuu-table";
import { InstrumentSearch } from "@finos/vuu-ui-controls";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BasketSelectorRow } from "./BasketSelectorRow";

import "./BasketSelector.css";

const classBase = "vuuBasketSelector";

export interface BasketSelectorProps extends HTMLAttributes<HTMLDivElement> {
  basketId?: string;
  dataSourceBasket: DataSource;
  dataSourceBasketSearch: DataSource;
  label?: string;
  onClickAddBasket: () => void;
}

export class Basket {
  currency: string;
  exchangeRateToUSD: number;
  name: string;
  symbolName: string;

  constructor(data: VuuDataRow, columnMap: ColumnMap) {
    this.currency = data[columnMap.currency] as string;
    this.exchangeRateToUSD = data[columnMap.exchangeRateToUSD] as number;
    this.name = data[columnMap.name] as string;
    this.symbolName = data[columnMap.symbolName] as string;
  }
}

export const BasketSelector = ({
  basketId: basketIdProp,
  dataSourceBasket,
  dataSourceBasketSearch,
  id: idProp,
  onClickAddBasket,
  ...htmlAttributes
}: BasketSelectorProps) => {
  // const [basket, setBasket] = useState<Basket | undefined>(new Basket());
  const rootRef = useRef<HTMLDivElement>(null);
  const columnMap = useMemo(
    () => buildColumnMap(dataSourceBasket.columns),
    [dataSourceBasket.columns]
  );
  const [open, setOpen] = useState(false);
  const [basketId, setBasketId] = useState<string | undefined>(basketIdProp);
  const [basket, setBasket] = useState<Basket | undefined>();
  const id = useId(idProp);
  const handleData = useCallback<SubscribeCallback>(
    (message) => {
      if (message.type === "viewport-update" && message.rows?.length === 1) {
        setBasket(new Basket(message.rows[0], columnMap));
      }
    },
    [columnMap]
  );

  const toggleSearch = useCallback(() => {
    setOpen((open) => !open);
  }, []);

  useMemo(() => {
    console.log("subscribe to basket");
    dataSourceBasket.subscribe(
      {
        range: { from: 0, to: 1 },
        filter: { filter: `id = "NONE"` },
      },
      handleData
    );
  }, [dataSourceBasket, handleData]);

  useEffect(() => {
    console.log(`apply filter id = ${basketId}`);
    dataSourceBasket.filter = { filter: `id = "${basketId ?? "NONE"}"` };
  }, [basketId, dataSourceBasket]);

  const handleRowClick = useCallback<TableRowClickHandler>(
    (row) => {
      const { id } = columnMap;
      const basketId = row[id] as string;
      setBasketId(basketId);
      setOpen(false);
    },
    [columnMap]
  );

  const tableProps: Partial<TableProps> = useMemo(
    () => ({
      Row: BasketSelectorRow,
      config: {
        columns: [
          { name: "id", width: 300 },
          {
            hidden: true,
            name: "name",
            width: 200,
          },
          {
            hidden: true,
            name: "symbolName",
            width: 100,
            type: {
              name: "string",
            },
          },
        ],
      },
      onRowClick: handleRowClick,
      rowHeight: 47,
    }),
    [handleRowClick]
  );

  const handleClickAddBasket = useCallback(() => {
    setOpen(false);
    onClickAddBasket();
  }, [onClickAddBasket]);

  return (
    <div {...htmlAttributes} className={classBase} ref={rootRef}>
      <div className={`${classBase}-basketDetails`}>
        <label className={`${classBase}-label`} id={`${id}-name`}>
          Basket Name
        </label>
        <label className={`${classBase}-label`} id={`${id}-symbol`}>
          Symbol
        </label>
        <label className={`${classBase}-label`} id={`${id}-exchange`}>
          GBP to USD
        </label>
        <span
          className={`${classBase}-basketName`}
          aria-labelledby={`${id}-name`}
        >
          {basket?.name}
        </span>
        <span
          className={`${classBase}-symbolName`}
          aria-labelledby={`${id}-symbol`}
        >
          {basket?.symbolName}
        </span>
        <PriceTicker
          aria-labelledby={`${id}-exchange`}
          className={`${classBase}-exchangeRate`}
          decimals={4}
          price={basket?.exchangeRateToUSD}
          showArrow
        />
      </div>
      <Button
        className={`${classBase}-trigger`}
        data-icon="chevron-down"
        onClick={toggleSearch}
        variant="secondary"
      />
      <Portal open={open}>
        <Popup anchorElement={rootRef} placement="below">
          <div className={`${classBase}-searchContainer`}>
            <InstrumentSearch
              className={`${classBase}-instrumentSearch`}
              TableProps={tableProps}
              dataSource={dataSourceBasketSearch}
              searchColumn="name"
            />
            <div className={`${classBase}-buttonBar`}>
              <Button onClick={handleClickAddBasket} variant="secondary">
                Add New Basket
              </Button>
            </div>
          </div>
        </Popup>
      </Portal>
    </div>
  );
};
