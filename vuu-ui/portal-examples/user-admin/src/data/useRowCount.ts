import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useEffect, useState } from "react";

/** The number of rows a data source currently holds, after filtering. */
export const useRowCount = (dataSource: DataSource) => {
  const [size, setSize] = useState(dataSource.size);
  useEffect(() => {
    setSize(dataSource.size);
    const handleResize = (nextSize: number) => setSize(nextSize);
    dataSource.on("resize", handleResize);
    return () => {
      dataSource.removeListener("resize", handleResize);
    };
  }, [dataSource]);
  return size;
};
