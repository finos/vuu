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

export interface BasketTradingFeatureProps {
  basketDefinitionsSchema: TableSchema;
  basketDesignSchema: TableSchema;
}

const VuuBasketTradingFeature = ({
  basketDesignSchema,
  basketDefinitionsSchema,
}: BasketTradingFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();
  const [active, setActive] = useState(0);

  // const handleDataSourceConfigChange = useCallback(
  //   (config: DataSourceConfig | undefined, confirmed?: boolean) => {
  //     // confirmed / unconfirmed messages are used for UI updates, not state saving
  //     if (confirmed === undefined) {
  //       save?.(config, "datasource-config");
  //     }
  //   },
  //   [save]
  // );

  const [basketDefinitionsDataSource, basketDesignDataSource] = useMemo(() => {
    // prettier-ignore
    let ds1 = loadSession?.("basket-definitions-data-source") as RemoteDataSource;
    let ds2 = loadSession?.("basket-design-data-source") as RemoteDataSource;
    if (ds1 && ds2) {
      return [ds1, ds2];
    }

    ds1 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDefinitionsSchema.table,
      columns: basketDefinitionsSchema.columns.map((col) => col.name),
      title,
    });
    ds2 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDesignSchema.table,
      columns: basketDesignSchema.columns.map((col) => col.name),
      title,
    });
    // ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds1, "basket-definitions-data-source");
    saveSession?.(ds2, "basket-design-data-source");
    return [ds1, ds2];
  }, [
    basketDefinitionsSchema.columns,
    basketDefinitionsSchema.table,
    basketDesignSchema.columns,
    basketDesignSchema.table,
    id,
    loadSession,
    saveSession,
    title,
  ]);

  useEffect(() => {
    basketDesignDataSource.resume?.();
    return () => {
      basketDesignDataSource.suspend?.();
    };
  }, [basketDesignDataSource]);

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
        <BasketToolbar dataSource={basketDefinitionsDataSource} />
        <Stack
          active={active}
          className={`${classBase}-stack`}
          onTabSelectionChanged={setActive}
          style={{ flex: 1 }}
        >
          <BasketTableEdit
            data-tab-location="basket-design"
            data-tab-title="Design"
            dataSource={basketDesignDataSource}
            tableSchema={basketDesignSchema}
          />
          <BasketTableLive data-tab-title="On Market" />
        </Stack>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
