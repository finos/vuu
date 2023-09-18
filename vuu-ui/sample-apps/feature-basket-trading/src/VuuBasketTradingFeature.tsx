import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { FlexboxLayout, Stack, useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";
import { useBasketTabMenu } from "./useBasketTabMenu";

import "./VuuBasketTradingFeature.css";

const classBase = "VuuBasketTradingFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

const VuuBasketTradingFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();
  const [active, setActive] = useState(0);

  const handleDataSourceConfigChange = useCallback(
    (config: DataSourceConfig | undefined, confirmed?: boolean) => {
      // confirmed / unconfirmed messages are used for UI updates, not state saving
      if (confirmed === undefined) {
        save?.(config, "datasource-config");
      }
    },
    [save]
  );

  const dataSource: DataSource = useMemo(() => {
    let ds = loadSession?.("data-source") as RemoteDataSource;
    if (ds) {
      return ds;
    }

    ds = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: tableSchema.table,
      columns: tableSchema.columns.map((col) => col.name),
      title,
    });
    ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds, "data-source");
    return ds;
  }, [
    handleDataSourceConfigChange,
    id,
    loadSession,
    saveSession,
    tableSchema.columns,
    tableSchema.table,
    title,
  ]);

  useEffect(() => {
    dataSource.resume?.();
    return () => {
      dataSource.suspend?.();
    };
  }, [dataSource]);

  const [buildMenuOptions, handleMenuAction] = useBasketTabMenu();

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <FlexboxLayout
        className={classBase}
        style={{ flexDirection: "column", height: "100%" }}
      >
        <BasketToolbar />
        <Stack
          active={active}
          className={`${classBase}-stack`}
          onTabSelectionChanged={setActive}
        >
          <BasketTableEdit
            data-tab-location="basket-design"
            data-tab-title="Design"
          />
          <BasketTableLive data-tab-title="On Market" />
        </Stack>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
