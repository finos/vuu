import { Button } from "@salt-ds/core";
import { isVisualLinksMessage, useData } from "@vuu-ui/vuu-utils";
import { ReactElement, useCallback, useMemo, useState } from "react";

const Source = ({
  id,
  onRemove,
}: {
  id: string;
  onRemove: (id: string) => void;
}) => {
  const { VuuDataSource } = useData();
  const [size, setSize] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const dataSource = useMemo(() => {
    const ds = new VuuDataSource({
      table: { module: "SIMUL", table: "childOrders" },
    });
    ds.subscribe({}, (msg) => {
      if (msg.type === "viewport-update" && msg.size) {
        setSize(msg.size);
      } else if (isVisualLinksMessage(msg)) {
        setLinkCount(msg.links.length);
      }
    });
    return ds;
  }, [VuuDataSource]);
  const handleRemove = useCallback(() => {
    dataSource.unsubscribe();
    onRemove(id);
  }, [dataSource, id, onRemove]);
  return (
    <div className="Source" id={id}>
      <div>Record Count: {size}</div>
      <div>Link Count: {linkCount}</div>
      <Button onClick={handleRemove}>Remove</Button>
    </div>
  );
};

const Target = ({
  id,
  onRemove,
}: {
  id: string;
  onRemove: (id: string) => void;
}) => {
  const { VuuDataSource } = useData();
  const [size, setSize] = useState(0);
  const dataSource = useMemo(() => {
    const ds = new VuuDataSource({
      table: { module: "SIMUL", table: "parentOrders" },
    });
    ds.subscribe({}, (msg) => {
      if (msg.type === "viewport-update" && msg.size) {
        setSize(msg.size);
      }
    });
    return ds;
  }, [VuuDataSource]);
  const handleRemove = useCallback(() => {
    dataSource.unsubscribe();
    onRemove(id);
  }, [dataSource, id, onRemove]);
  return (
    <div className="Target" id={id}>
      <div>{size}</div>
      <Button onClick={handleRemove}>Remove</Button>
    </div>
  );
};

let _id = 1;

/** tags=data-consumer */
export const AvailableLinkTargets = () => {
  const [, forceRender] = useState({});
  const [sources, targets] = useMemo<
    [Map<string, ReactElement>, Map<string, ReactElement>]
  >(() => [new Map(), new Map()], []);

  const addSource = useCallback(() => {
    const id = `${_id++}`;
    const source = (
      <Source
        id={id}
        key={id}
        onRemove={(id) => {
          sources.delete(id);
          forceRender({});
        }}
      />
    );
    sources.set(id, source);
    forceRender({});
  }, [sources]);

  const addTarget = useCallback(() => {
    const id = `${_id++}`;
    const target = (
      <Target
        id={id}
        key={id}
        onRemove={(id) => {
          targets.delete(id);
          forceRender({});
        }}
      />
    );
    targets.set(id, target);
    forceRender({});
  }, [targets]);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <style>{`
            .Container {
                background: blue;
                display: flex;
                flex-direction: column;
                min-height: 600px;
                gap: 4px;
                padding: 4px;
            }
            .Source {
                background: yellow;
                height: 100px;
            }
            .Target {
                background: red;
                height: 100px;
            }
        `}</style>
      <div>
        <Button onClick={addSource}>Add Link Source (child)</Button>
        <div className="Container">{Array.from(sources.values())}</div>
      </div>
      <div>
        <Button onClick={addTarget}>Add Link Target (parent)</Button>
        <div className="Container">{Array.from(targets.values())}</div>
      </div>
    </div>
  );
};
