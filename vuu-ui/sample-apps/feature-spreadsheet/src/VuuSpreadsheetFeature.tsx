import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { FilterTable } from "@vuu-ui/vuu-datatable";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import {
  DataSourceStats,
  TabbedTableSettingsAction,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import type { FilterTableFeatureProps as SpreadsheetFeatureProps } from "@vuu-ui/vuu-utils";
import { useSpreadsheetFeature } from "./useSpreadsheetFeature";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";
import { DataEditingProvider } from "@vuu-ui/vuu-data-editing";

import "./VuuSpreadsheetFeature.css";

const classBase = "vuuSpreadsheetFeature";

const VuuSpreadsheetFeature = ({ tableSchema }: SpreadsheetFeatureProps) => {
  const {
    columnModel,
    editSession,
    menuBuilder,
    filterBarProps,
    menuActionHandler,
    onTableDisplayAttributeChange,
    tableProps,
  } = useSpreadsheetFeature({ tableSchema });
  return tableProps.dataSource ? (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <ContextPanelProvider>
        <FlexboxLayout
          className={classBase}
          style={{ flexDirection: "column", height: "100%" }}
        >
          <DataEditingProvider editSession={editSession}>
            <FilterTable
              FilterBarProps={filterBarProps}
              TableProps={tableProps}
              style={{ flex: "1 1 auto" }}
            />
          </DataEditingProvider>
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
  ) : null;
};

export default VuuSpreadsheetFeature;
