import { DataSource } from "@finos/vuu-data";
import { VuuRange } from "@finos/vuu-protocol-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useCallback, useEffect, useState } from "react";

export const useDataSource = ({
  dataSource,
  initialRange,
}: {
  dataSource: DataSource;
  initialRange: VuuRange;
}) => {
  const [data, setData] = useState<DataSourceRow[]>([]);
  useEffect(() => {
    dataSource?.subscribe({ range: initialRange }, (message) => {
      if (message.type === "viewport-update") {
        // if (message.size) {
        //   console.log(`useDataSourcesize = ${message.size}`);
        // }
        if (message.rows) {
          setData(message.rows);
        }
      }
    });
  }, [dataSource, initialRange]);

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
