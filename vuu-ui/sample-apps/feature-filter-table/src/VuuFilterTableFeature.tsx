import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import {
  DataSourceStats,
  TabbedTableSettingsAction,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import { FilterTableFeatureProps } from "@vuu-ui/vuu-utils";
import { useFilterTableFeature } from "./useFilterTableFeature";

import "./VuuFilterTableFeature.css";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";

const classBase = "vuuFilterTableFeature";

const VuuFilterTableFeature = ({ tableSchema }: FilterTableFeatureProps) => {
  const {
    columnModel,
    menuBuilder,
    filterBarProps,
    menuActionHandler,
    onTableDisplayAttributeChange,
    tableProps,
  } = useFilterTableFeature({ tableSchema });
  return (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <ContextPanelProvider>
        <FlexboxLayout
          className={classBase}
          style={{ flexDirection: "column", height: "100%" }}
        >
          <FilterTable
            FilterBarProps={filterBarProps}
            TableProps={tableProps}
            style={{ flex: "1 1 auto" }}
          />
          <TableFooter>
            <DataSourceStats dataSource={tableProps.dataSource} />
            <TableFooterTray>
              <TabbedTableSettingsAction
                allowCreateCalculatedColumn
                columnModel={columnModel}
                config={tableProps.config}
                data-embedded
                onDisplayAttributeChange={onTableDisplayAttributeChange}
                vuuTable={tableSchema.table}
              />
            </TableFooterTray>
          </TableFooter>
        </FlexboxLayout>
      </ContextPanelProvider>
    </ContextMenuProvider>
  );
};

export default VuuFilterTableFeature;
