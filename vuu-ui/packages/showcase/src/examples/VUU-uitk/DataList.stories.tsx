import { Button, FormField, Input } from "@heswell/uitk-core";
import { List, VirtualizedList } from "@heswell/uitk-lab";
import {
  CollectionProvider,
  ScrollingAPI,
} from "@heswell/uitk-lab/src/common-hooks";
import { ArrayLike } from "./ArrayLike";
import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
  useDataSource,
  useViewserver,
} from "@vuu-ui/data-remote";
import { VuuUIRow } from "@vuu-ui/data-remote/src/vuuUIMessageTypes";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { metadataKeys, WindowRange } from "@vuu-ui/utils";

const { IDX, KEY } = metadataKeys;

const toCollectionItem = (data: VuuUIRow) => {
  return {
    id: data[KEY],
    label: `[${data[KEY]} @ ${data[IDX]}] ${data[8]}`,
    value: data,
  };
};

const useVuuCollectionHook = (data, size, range) => {
  const ref = useRef<ArrayLike>();
  const windowedData = useMemo(() => {
    if (ref.current === undefined) {
      ref.current = new ArrayLike(
        data.map(toCollectionItem),
        size,
        new WindowRange(range.from, range.to)
      );
    } else {
      ref.current.length = size;
      ref.current.range = range;
      ref.current.data = data.map(toCollectionItem);
    }
    return ref.current;
  }, [data, range, size]);

  return {
    data: windowedData,
    itemToCollectionItem: (sel) => {
      if (sel) {
        const [idx] = sel;
        return windowedData[idx];
      }
      return null;
    },
  };
};

export const DefaultList = () => {
  const [data, setData] = useState<string[]>([]);

  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize: 100,
      columns: ["description"],
      table: { table: "instruments", module: "SIMUL" },
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, []);

  const virtualRef = useRef<ScrollingAPI<VuuUIRow> | null>(null);
  const [data2, size, range, setRange] = useDataSource({ dataSource });
  const collectionHook = useVuuCollectionHook(data2, size, range);
  if (data2.some((d) => d == undefined)) {
    debugger;
  }
  const selectedRow = data2.find((row) => row[7]) ?? null;
  const { makeRpcCall } = useViewserver();

  useEffect(() => {
    const connect = async () => {
      console.log(`DataList stories authenticate as steve`);
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const load = useCallback(async () => {
    const data = await makeRpcCall({
      type: "RPC_CALL",
      method: "getUniqueFieldValues",
      params: [{ table: "instruments", module: "SIMUL" }, "description"],
    });
    setData(data);
  }, [makeRpcCall]);

  const handleViewportScroll = useCallback(
    (firstVisibleRowIndex: number, lastVisibleRowIndex: number) => {
      if (
        range.from !== firstVisibleRowIndex ||
        range.to !== lastVisibleRowIndex + 1
      ) {
        setRange({ from: firstVisibleRowIndex, to: lastVisibleRowIndex + 1 });
      }
    },
    [range]
  );

  const handleSelect = useCallback(
    (evt, row) => {
      dataSource.select([row[0]]);
    },
    [dataSource]
  );

  const layout = {
    display: "grid",
    gridTemplateColumns: "1fr 350px",
    gridTemplateRows: "40px 1fr 40px",
    gap: "10px 20px",
    height: 500,
    margin: "10px auto",
    width: 600,
  } as CSSProperties;

  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleChangeFrom = useCallback((e, value) => {
    const val = parseInt(value, 10);
    if (!isNaN(val)) {
      setRangeFrom(val);
    }
  }, []);
  const handleChangeTo = useCallback((e, value) => {
    const val = parseInt(value, 10);
    if (!isNaN(val)) {
      setRangeTo(val);
    }
  }, []);
  const handleChangeScrollTop = useCallback((e, value) => {
    const val = parseInt(value, 10);
    if (!isNaN(val)) {
      setScrollTop(val);
    }
  }, []);

  const setDataSourceRange = useCallback(() => {
    dataSource.setRange(rangeFrom, rangeTo);
  }, [rangeFrom, rangeTo]);

  const scrollToPos = useCallback(() => {
    console.log(`scrollToPos ${scrollTop}`);
    virtualRef.current?.scrollTo(scrollTop);
  }, [scrollTop]);

  return (
    <div style={layout}>
      <Button onClick={load}>Load</Button>
      <span />
      <List aria-label="Listbox example" source={data} />
      <CollectionProvider collectionHook={collectionHook}>
        <VirtualizedList
          aria-label="Listbox example"
          onSelect={handleSelect}
          onViewportScroll={handleViewportScroll}
          scrollingApiRef={virtualRef}
          selected={selectedRow}
        />
      </CollectionProvider>
      <span />
      <div style={{ display: "flex", gap: 10 }}>
        <FormField label="from" labelPlacement="left">
          <Input value={`${rangeFrom}`} onChange={handleChangeFrom} />
        </FormField>
        <FormField label="to" labelPlacement="left">
          <Input value={`${rangeTo}`} onChange={handleChangeTo} />
        </FormField>
        <Button onClick={setDataSourceRange} style={{ flex: "0 0 120px" }}>
          Set Range
        </Button>
      </div>
      <span />
      <div style={{ display: "flex", gap: 10 }}>
        <FormField label="Scroll To px" labelPlacement="left">
          <Input value={`${scrollTop}`} onChange={handleChangeScrollTop} />
        </FormField>
        <Button onClick={scrollToPos} style={{ flex: "0 0 120px" }}>
          Scroll To Pos
        </Button>
      </div>
    </div>
  );
};
