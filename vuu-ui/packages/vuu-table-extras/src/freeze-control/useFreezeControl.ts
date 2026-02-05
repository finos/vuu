import {
  DataSource,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { messageHasSize, useData } from "@vuu-ui/vuu-utils";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";

export interface FreezeProps {
  dataSource: DataSource;
}

type FreezeState = {
  isFrozen: boolean;
  newRecordCount: number;
};

const FreezeState = (
  dataSource: DataSource,
  newRecordCount: number,
): FreezeState => ({
  isFrozen: dataSource.isFrozen ?? false,
  newRecordCount,
});

export const useFreezeControl = ({ dataSource }: FreezeProps) => {
  const { VuuDataSource } = useData();
  const table = useMemo<VuuTable>(() => {
    if (dataSource.table === undefined) {
      throw Error(`[useFreezeControls] dataSource must have VuuTable`);
    }
    return dataSource.table;
  }, [dataSource]);
  const [freezeState, setFreezeState] = useState<FreezeState>(
    FreezeState(dataSource, 0),
  );

  const [startTrackingNewRows, stopTrackingNewRows] = useMemo(() => {
    let ds: DataSource | undefined = undefined;

    const dataCallback: DataSourceSubscribeCallback = (message) => {
      if (messageHasSize(message)) {
        setFreezeState((prev) => ({
          ...prev,
          newRecordCount: message.size,
        }));
      }
    };

    const start = (ts: number) => {
      ds = new VuuDataSource({ columns: ["vuuCreatedTimestamp"], table });
      ds.subscribe(
        {
          filterSpec: {
            filter: `vuuCreatedTimestamp > ${ts}`,
          },
        },
        dataCallback,
      );
    };

    const stop = () => {
      ds?.unsubscribe();
    };

    return [start, stop];
  }, [VuuDataSource, table]);

  const handleToggleChange = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const value = (evt.target as HTMLButtonElement).value;
      if (value === "frozen") {
        dataSource.freeze?.();
        startTrackingNewRows(dataSource.freezeTimestamp as number);
      } else {
        dataSource.unfreeze?.();
        stopTrackingNewRows();
      }
      setFreezeState(FreezeState(dataSource, 0));
    },
    [dataSource, startTrackingNewRows, stopTrackingNewRows],
  );

  return {
    ...freezeState,
    onToggleChange: handleToggleChange,
  };
};
