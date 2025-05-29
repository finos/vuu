import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { Flexbox } from "@vuu-ui/vuu-layout";
import {
  DragDropProvider,
  TableSearch,
  useDragDropProvider,
} from "@vuu-ui/vuu-ui-controls";
import type { DataSourceRow, TableSchema } from "@vuu-ui/vuu-data-types";
import type { GlobalDropHandler } from "@vuu-ui/vuu-ui-controls";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDataSource } from "@vuu-ui/vuu-utils";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import {
  Accordion,
  AccordionGroup,
  AccordionHeader,
  AccordionPanel,
} from "@salt-ds/core";
import { TableConfig } from "@vuu-ui/vuu-table-types";

const TableSearchTemplate = ({
  schema,
  TableProps: TablePropsProp,
}: {
  schema: TableSchema;
  TableProps?: Partial<TableProps>;
}) => {
  const { VuuDataSource } = useDataSource();
  const { table } = schema;

  const TableProps = useMemo<TableProps>(
    () => ({
      config: {
        columns: [
          {
            name: "description",
            width: 200,
            type: {
              name: "string",
              renderer: {
                name: "search-cell",
              },
            },
          },
        ],
        ...TablePropsProp?.config,
      },
      dataSource: new VuuDataSource({
        columns: schema.columns.map((c) => c.name),
        table,
      }),
      ...TablePropsProp,
    }),
    [TablePropsProp, VuuDataSource, schema.columns, table],
  );

  return (
    <TableSearch
      TableProps={TableProps}
      autoFocus
      searchColumns={["description"]}
      style={{ height: 400, width: 250 }}
    />
  );
};

export const DefaultInstrumentSearch = () => {
  const schema = getSchema("instruments");
  return (
    <LocalDataSourceProvider>
      <TableSearchTemplate schema={schema} />
    </LocalDataSourceProvider>
  );
};

export const InstrumentSearchVuuInstruments = () => {
  const schema = getSchema("instruments");
  return (
    <VuuDataSourceProvider>
      <TableSearchTemplate schema={schema} />;
    </VuuDataSourceProvider>
  );
};

type DropTargetProps = HTMLAttributes<HTMLDivElement>;
const DropTarget = ({ id, ...htmlAttributes }: DropTargetProps) => {
  const [instrument, setInstrument] = useState<DataSourceRow>();
  const { isDragSource, isDropTarget, register } = useDragDropProvider(id);

  console.log(
    `DropTarget isDragSource ${isDragSource} isDropTarget ${isDropTarget}`,
  );

  const acceptDrop = useCallback<GlobalDropHandler>((dragState) => {
    console.log({ payload: dragState.payload });
    setInstrument(dragState.payload as DataSourceRow);
  }, []);

  useEffect(() => {
    if (id && (isDragSource || isDropTarget)) {
      register(id, false, acceptDrop);
    }
  }, [acceptDrop, id, isDragSource, isDropTarget, register]);

  return (
    <div {...htmlAttributes} id={id} style={{ background: "yellow", flex: 1 }}>
      {instrument ? (
        <>
          <span>{instrument[8]}</span>
          <span> - </span>
          <span>{instrument[10]}</span>
        </>
      ) : null}
    </div>
  );
};

export const InstrumentSearchDragDrop = () => {
  const schema = getSchema("instruments");

  const dragSource = useMemo(
    () => ({
      "source-table": { dropTargets: "drop-target" },
    }),
    [],
  );

  const handleDragStart = useCallback(() => {
    console.log("DragStart");
  }, []);

  return (
    <LocalDataSourceProvider>
      <DragDropProvider dragSources={dragSource}>
        <Flexbox>
          <TableSearchTemplate
            schema={schema}
            TableProps={{
              allowDragDrop: "drag-copy",
              id: "source-table",
              onDragStart: handleDragStart,
            }}
          />
          <DropTarget id="drop-target" />
        </Flexbox>
      </DragDropProvider>
    </LocalDataSourceProvider>
  );
};

const EnhancedInstrumentSearch = () => {
  const { VuuDataSource } = useDataSource();
  const schema = getSchema("instruments");
  const pinnedConfig = useMemo<TableConfig>(
    () => ({
      columns: [{ name: "description", serverDataType: "string" }],
    }),
    [],
  );
  const pinnedDataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  const searchTableProps = useMemo<Partial<TableProps>>(
    () => ({
      config: {
        columns: [
          { name: "description" },
          { name: "pinned", serverDataType: "boolean", width: 60 },
        ],
        columnLayout: "fit",
      },
    }),
    [],
  );
  return (
    <AccordionGroup>
      <Accordion
        className={"accordion"}
        defaultExpanded
        value={"mountains-and-hills"}
        id="1"
      >
        <AccordionHeader>Pinned Instruments</AccordionHeader>
        <AccordionPanel>
          <Table
            config={pinnedConfig}
            dataSource={pinnedDataSource}
            maxViewportRowLimit={10}
            showColumnHeaders={false}
          />
        </AccordionPanel>
      </Accordion>
      <Accordion
        className={"accordion"}
        defaultExpanded
        value={"mountains-and-hills"}
        id="1"
      >
        <AccordionHeader>Instrument Search</AccordionHeader>
        <AccordionPanel>
          <TableSearchTemplate schema={schema} TableProps={searchTableProps} />
        </AccordionPanel>
      </Accordion>
    </AccordionGroup>
  );
};

export const InstrumentSearchFavourites = () => {
  return (
    <LocalDataSourceProvider>
      <EnhancedInstrumentSearch />
    </LocalDataSourceProvider>
  );
};
