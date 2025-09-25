import { DataSource, RowSelectionEventHandler } from "@vuu-ui/vuu-data-types";
import { formatDate, Range } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useState } from "react";

export interface DatasourceStatsHookProps {
  dataSource: DataSource;
  showFreezeStatus?: boolean;
  showRowStats?: boolean;
  showSelectionStats?: boolean;
}

const timeFormatter = formatDate({ time: "hh:mm:ss" });

const formatTime = (ts: number | undefined) => {
  if (typeof ts === "number") {
    return timeFormatter(new Date(ts));
  } else {
    return undefined;
  }
};

export const useDatasourceStats = ({
  dataSource,
}: DatasourceStatsHookProps) => {
  const [selectedCount, setSelectedCount] = useState(0);
  const [range, setRange] = useState<Range>(dataSource.range);
  const [size, setSize] = useState(dataSource.size);
  const [freezeTime, setFreezeTime] = useState(
    formatTime(dataSource.freezeTimestamp),
  );

  const handleFreeze = useCallback(
    (isFrozen: boolean, freezeTimestamp: number) => {
      if (isFrozen) {
        setFreezeTime(formatTime(freezeTimestamp));
      } else {
        setFreezeTime(undefined);
      }
    },
    [],
  );

  const handleRowSelection = useCallback<RowSelectionEventHandler>((count) => {
    setSelectedCount(count);
  }, []);

  const handleSize = useCallback((size: number) => {
    setSize(size);
  }, []);

  useMemo(() => {
    setSize(dataSource.size);
    dataSource.on("resize", handleSize);
    dataSource.on("range", setRange);
    dataSource.on("freeze", handleFreeze);
    dataSource.on("row-selection", handleRowSelection);
    return () => {
      dataSource.removeListener("resize", handleSize);
      dataSource.removeListener("range", setRange);
      dataSource.removeListener("freeze", handleFreeze);
      dataSource.removeListener("row-selection", handleRowSelection);
    };
  }, [dataSource, handleFreeze, handleRowSelection, handleSize]);

  return {
    range,
    selectedCount,
    size,
    freezeTime,
  };
};
