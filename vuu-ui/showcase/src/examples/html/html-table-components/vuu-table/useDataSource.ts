import { DataSource, DataSourceRow } from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { useCallback, useMemo, useState } from "react";

export const useDataSource = ({
  dataSource,
  initialRange,
  onSizeChange,
}: {
  dataSource: DataSource;
  initialRange: VuuRange;
  onSizeChange: (size: number) => void;
}) => {
  const [data, setData] = useState<DataSourceRow[]>([]);
  // useEffect(() => {
  useMemo(() => {
    dataSource?.subscribe({ range: initialRange }, (message) => {
      if (message.type === "viewport-update") {
        if (message.size) {
          onSizeChange(message.size);
        }
        if (message.rows) {
          if (message.mode === "update") {
            setData((existingRows) =>
              existingRows.map(
                (row) =>
                  message.rows?.find(([rowIdx]) => rowIdx === row[0]) ?? row
              )
            );
          } else {
            setData(message.rows);
          }
        }
      }
    });
  }, [dataSource, initialRange, onSizeChange]);

  const setRange = useCallback(
    (range: VuuRange) => {
      dataSource.range = range;
    },
    [dataSource]
  );

  return {
    data,
    setRange,
  };
};
