import { useData } from "@vuu-ui/core";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { filterAsQuery, Range } from "@vuu-ui/vuu-utils";
import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "./admin-contract";

/** Server-side row count for `table` matching `filter`, using a one-row viewport. */
export const useFilteredCount = (
  table: VuuTable,
  column: string,
  filter: Filter | undefined,
) => {
  const { VuuDataSource } = useData();
  const [count, setCount] = useState<number>();
  const [error, setError] = useState<string>();
  const query = useMemo(() => {
    try {
      return filter ? filterAsQuery(filter) : undefined;
    } catch (cause) {
      return cause instanceof Error ? cause : new Error(String(cause));
    }
  }, [filter]);

  useEffect(() => {
    setCount(undefined);
    setError(undefined);
    if (query instanceof Error) {
      setError(query.message);
      return;
    }
    const dataSource = new VuuDataSource({
      columns: [column],
      filterSpec: query ? { filter: query } : undefined,
      table,
    });
    let active = true;
    const resize = (size: number) => {
      if (active) setCount(size);
    };
    dataSource.on("resize", resize);
    void dataSource
      .subscribe({ range: Range(0, 1) }, (message) => {
        if (!active) return;
        if (message.type === "viewport-update" && message.size !== undefined) {
          setCount(message.size);
        } else if (message.type === "subscribe-failed") {
          setError(message.msg);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
      dataSource.removeListener("resize", resize);
      dataSource.unsubscribe();
    };
  }, [column, query, table, VuuDataSource]);

  return { count, error };
};
