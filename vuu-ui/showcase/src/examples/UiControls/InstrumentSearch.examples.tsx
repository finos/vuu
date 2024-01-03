import { getAllSchemas, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { Flexbox } from "@finos/vuu-layout";
import {
  DragDropProvider,
  InstrumentSearch,
  useDragDropProvider,
} from "@finos/vuu-ui-controls";
import type { DataSourceRow } from "@finos/vuu-data-types";
import type { GlobalDropHandler } from "@finos/vuu-ui-controls";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTestDataSource } from "../utils";

let displaySequence = 1;

export const DefaultInstrumentSearch = () => {
  const dataSource = useMemo(
    () => vuuModule<SimulTableName>("SIMUL").createDataSource("instruments"),
    []
  );
  return (
    <InstrumentSearch
      autoFocus
      dataSource={dataSource}
      style={{ height: 400, width: 250 }}
    />
  );
};

DefaultInstrumentSearch.displaySequence = displaySequence++;

export const InstrumentSearchVuuInstruments = () => {
  const { dataSource, error } = useTestDataSource({
    schemas: getAllSchemas(),
  });

  if (error) {
    return error;
  }

  return (
    <InstrumentSearch
      dataSource={dataSource}
      searchColumns={["bbg", "description"]}
      style={{ height: 400, width: 250 }}
    />
  );
};

InstrumentSearchVuuInstruments.displaySequence = displaySequence++;

type DropTargetProps = HTMLAttributes<HTMLDivElement>;
const DropTarget = ({ id, ...htmlAttributes }: DropTargetProps) => {
  const [instrument, setInstrument] = useState<DataSourceRow>();
  const { isDragSource, isDropTarget, register } = useDragDropProvider(id);

  console.log(
    `DropTarget isDragSource ${isDragSource} isDropTarget ${isDropTarget}`
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
  const dataSource = useMemo(
    () => vuuModule<SimulTableName>("SIMUL").createDataSource("instruments"),
    []
  );

  const dragSource = useMemo(
    () => ({
      "source-table": { dropTargets: "drop-target" },
    }),
    []
  );

  const handleDragStart = useCallback(() => {
    console.log("DragStart");
  }, []);

  return (
    <DragDropProvider dragSources={dragSource}>
      <Flexbox>
        <InstrumentSearch
          TableProps={{
            allowDragDrop: "drag-copy",
            id: "source-table",
            onDragStart: handleDragStart,
          }}
          autoFocus
          dataSource={dataSource}
          style={{ height: 400, width: 250 }}
        />
        <DropTarget id="drop-target" />
      </Flexbox>
    </DragDropProvider>
  );
};

InstrumentSearchDragDrop.displaySequence = displaySequence++;
