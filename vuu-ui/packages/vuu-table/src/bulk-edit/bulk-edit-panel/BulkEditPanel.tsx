import { DataSource } from "@finos/vuu-data-types";
import { Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { Button } from "@salt-ds/core";
import "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

type BulkEditPanelProps = {
  className?: string;
  tableConfig: TableConfig;
  dataSource: DataSource;
  onCancel: () => void;
  onEditMultiple: () => void;
  onSubmit: () => void;
};


export const BulkEditPanel = (props: BulkEditPanelProps): JSX.Element => {

    const { tableConfig, dataSource, onCancel, onEditMultiple, onSubmit } = props;

    return (
        <div className={classBase} style={{display: "flex", flexDirection: "column"}}>
            {/* <BulkEditRow columnMap={inputColMap} columns={inputColDescriptor} row={dataSource.data[0]} offset={1}></BulkEditRow> */}
            <div className={`${classBase}-table`}>
            <Table config={tableConfig} dataSource={dataSource} height={400} width={600} showColumnHeaderMenus={false} selectionModel="none"/>
            </div>
            
            <div className={`${classBase}-buttonBar`}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={onSubmit}>Save</Button>
            <Button onClick={onEditMultiple}>Edit Multiple</Button>
            </div>
            
        </div>
    );
};
