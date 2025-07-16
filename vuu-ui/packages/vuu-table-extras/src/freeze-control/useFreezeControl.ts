import {
  DataSource,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { formatDate, messageHasSize, useData } from "@vuu-ui/vuu-utils";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";

export interface FreezeProps {
  dataSource: DataSource;
}

type FreezeState = {
  isFrozen: boolean;
  label: string;
  lastUpdateMessage: string;
  newRecordCount: number;
};

const timeFormatter = formatDate({ time: "hh:mm:ss" });

const formatFreezeTime = (ts?: number) => {
  if (ts === undefined) {
    throw Error("[useFreezeControl] formatFreezeTime, freezeTime undefined");
  }
  return timeFormatter(new Date(ts));
};

const FreezeState = (
  dataSource: DataSource,
  newRecordCount: number,
): FreezeState => ({
  isFrozen: dataSource.isFrozen ?? false,
  label: dataSource.isFrozen ? "View Frozen" : "Freeze View",
  lastUpdateMessage: dataSource.isFrozen
    ? `at ${formatFreezeTime(dataSource.freezeTimestamp)}`
    : "",
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
        setFreezeState(FreezeState(dataSource, message.size));
      }
    };

    const start = (ts: number) => {
      ds = new VuuDataSource({ table });
      ds.subscribe(
        {
          filterSpec: {
            filter: `created > ${ts}`,
          },
        },
        dataCallback,
      );
    };

    const stop = () => {
      ds?.unsubscribe();
    };

    return [start, stop];
  }, [VuuDataSource, dataSource, table]);

  const handleSwitchChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      if (evt.target.checked) {
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
    onSwitchChange: handleSwitchChange,
  };
};
