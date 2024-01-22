import { TableSchema } from "@finos/vuu-data-types";
import { FilterTable } from "@finos/vuu-datatable";
import { FlexboxLayout } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { DataSourceStats } from "@finos/vuu-table-extras";
import cx from "clsx";
import { useFilterTable } from "./useFilterTable";

import "./VuuFilterTableFeature.css";

const classBase = "vuuFilterTableFeature";

export interface FilterTableFeatureProps {
  tableSchema: TableSchema;
}

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const {
    buildFilterTableMenuOptions,
    filterBarProps,
    handleFilterTableMenuAction,
    tableProps,
  } = useFilterTable({ tableSchema });

  return (
    <ContextMenuProvider
      menuActionHandler={handleFilterTableMenuAction}
      menuBuilder={buildFilterTableMenuOptions}
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
