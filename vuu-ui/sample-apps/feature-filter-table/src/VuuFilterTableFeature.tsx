import { FilterTable } from "@vuu-ui/vuu-datatable";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import { FilterTableFeatureProps } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useFilterTableFeature } from "./useFilterTableFeature";

import "./VuuFilterTableFeature.css";

const classBase = "vuuFilterTableFeature";

const footerStyle = {
  flex: "0 0 18px",
};

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const { menuBuilder, filterBarProps, menuActionHandler, tableProps } =
    useFilterTableFeature({ tableSchema });
  return (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
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
        <div
          className={cx("vuuToolbarProxy", `${classBase}-footer`)}
          style={footerStyle}
        >
          <DataSourceStats dataSource={tableProps.dataSource} />
        </div>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuFilterTableFeature;
