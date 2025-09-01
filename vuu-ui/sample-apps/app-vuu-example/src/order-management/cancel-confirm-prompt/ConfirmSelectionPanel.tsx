import { DataSource } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import { toColumnDescriptor } from "@vuu-ui/vuu-utils";

export interface ConfirmSelectionPanelProps {
  dataSource: DataSource;
}

const classBase = "vuuConfirmSelectionPanel";

export const ConfirmSelectionPanel = ({
  dataSource,
}: ConfirmSelectionPanelProps) => {
  console.log(`[CancelConfirmPanel] ${dataSource.viewport}`);
  return (
    <div className={classBase}>
      <Table
        allowDragColumnHeader={false}
        config={{ columns: dataSource.columns.map(toColumnDescriptor) }}
        dataSource={dataSource}
        height={380}
        width={600}
        showColumnHeaderMenus={false}
        selectionModel="none"
        maxViewportRowLimit={10}
      />
    </div>
  );
};
