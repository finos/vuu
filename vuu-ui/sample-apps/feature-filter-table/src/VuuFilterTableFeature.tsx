import { FilterTable } from "@vuu-ui/vuu-datatable";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { ContextMenuProvider } from "@vuu-ui/vuu-popups";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import { FilterTableFeatureProps } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useFilterTableFeature } from "./useFilterTableFeature";

import "./VuuFilterTableFeature.css";

const classBase = "vuuFilterTableFeature";

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const {
    buildFilterTableMenuOptions,
    filterBarProps,
    handleFilterTableMenuAction,
    tableProps,
  } = useFilterTableFeature({ tableSchema });

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
