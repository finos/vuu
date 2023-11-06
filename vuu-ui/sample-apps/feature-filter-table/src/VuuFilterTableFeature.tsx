import { TableSchema } from "@finos/vuu-data";
import { FilterTable } from "@finos/vuu-datatable";
import { FlexboxLayout } from "@finos/vuu-layout";
import { DataSourceStats } from "@finos/vuu-table-extras";
import cx from "classnames";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useFilterTable } from "./useFilterTable";

import "./VuuFilterTableFeature.css";

const classBase = "vuuFilterTableFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const {
    buildViewserverMenuOptions,
    filterBarProps,
    handleMenuAction,
    tableProps,
  } = useFilterTable({ tableSchema });

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <FlexboxLayout
        className={classBase}
        style={{ flexDirection: "column", height: "100%" }}
      >
        <FilterTable
          FilterBarProps={filterBarProps}
          TableProps={tableProps}
          style={{ flex: "1 1 auto" }}
        />
        <div className={cx("vuuToolbarProxy", `${classBase}-footer`)}>
          <DataSourceStats dataSource={tableProps.dataSource} />
        </div>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuFilterTableFeature;
