import { useIdMemo } from "@salt-ds/core";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type {
  DataSource,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { TableSearch } from "@vuu-ui/vuu-ui-controls";
import { buildColumnMap, metadataKeys, Range } from "@vuu-ui/vuu-utils";
import { createContext, useContext, useEffect, useState } from "react";
import { constituentFilter } from "./constituentFilter";

export const ActiveBasketContext = createContext<string | undefined>(undefined);

export const ConstituentSearch = ({
  dataSource,
}: {
  dataSource: DataSource;
}) => {
  const instanceId = useContext(ActiveBasketContext);
  const { getDataSource, clearDataSource } = useSessionDataSource();
  const id = useIdMemo();
  const [readyFor, setReadyFor] = useState<string>();
  const [exclusions, setExclusions] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!instanceId) {
      return;
    }
    setError(undefined);
    setReadyFor(undefined);
    const membership = getDataSource(`${id}-membership`, {
      table: { module: "BASKET", table: "basketTradingConstituentJoin" },
      columns: ["ric"],
      filterSpec: { filter: `instanceId = "${instanceId}"` },
      viewport: `${id}-membership`,
      bufferSize: 0,
    });
    const rows = new Map<number, string>();
    let active = true;
    let rangeEnd = 1;
    const onMessage: DataSourceSubscribeCallback = (message) => {
      if (!active) {
        return;
      }
      if (message.type === "subscribe-failed") {
        setError(message.msg);
        return;
      }
      if (message.type !== "viewport-update") {
        return;
      }
      const size = message.size ?? membership.size;
      if (size > rangeEnd) {
        rangeEnd = size;
        membership.range = Range(0, size);
      }
      if (message.rows) {
        const ricIndex = buildColumnMap(membership.columns).ric;
        for (const row of message.rows) {
          rows.set(Number(row[metadataKeys.IDX]), String(row[ricIndex]));
        }
      }
      for (const index of rows.keys()) {
        if (index >= size) {
          rows.delete(index);
        }
      }
      if (rows.size === size) {
        setExclusions(constituentFilter([...rows.values()]));
        setReadyFor(instanceId);
      }
    };
    void membership
      .subscribe({ columns: ["ric"], range: Range(0, 1) }, onMessage)
      .catch((error: unknown) => {
        if (active) {
          setError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      active = false;
      clearDataSource(`${id}-membership`, true);
    };
  }, [clearDataSource, dataSource, getDataSource, id, instanceId]);

  return error ? (
    <div role="alert">{error}</div>
  ) : readyFor === instanceId ? (
    <TableSearch
      baseFilter={exclusions}
      className="vuuBasketConstituentSearch"
      TableProps={{
        allowDragDrop: "drag-copy",
        config: {
          columnLayout: "fit",
          columns: [
            {
              name: "description",
              flex: 1,
              type: { name: "string", renderer: { name: "search-cell" } },
            },
            { name: "ric", hidden: true },
          ],
        },
        dataSource,
        id: "basket-instruments",
      }}
      searchColumns={["description"]}
    />
  ) : null;
};
