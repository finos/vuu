import { Button } from "@salt-ds/core";
import { PageVisibilityObserver } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo, useRef } from "react";
        
type TableDef = {
  name: string;
};

class TableDefImpl implements TableDef {
  constructor(public name: string) {}
}

function TableDef(name: string): TableDef {
  return new TableDefImpl(name);
}

export const ExperimentA = () => {
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const bc = useMemo(() => {
    const bc = new BroadcastChannel("example");
    bc.onmessage = ({ data }: MessageEvent) => {
      console.log(data);
    };
    return bc;
  }, []);

  useMemo(() => {
    const pageVisibilityObserver = new PageVisibilityObserver({
      inactiveTimeout: 30,
    });
    pageVisibilityObserver.on("inactive-timeout", () => {
      console.log("session timed out");
      bc.postMessage("session timed out");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });

    pageVisibilityObserver.on("hidden", () => {
      bc.postMessage(`hidden`);
      timerRef.current = setInterval(() => {
        bc.postMessage(Date.now());
      }, 1000);
    });
    pageVisibilityObserver.on("visible", () => {
      bc.postMessage(`visible`);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });

    console.log(`document visibility State ${document.visibilityState}`);
  }, [bc]);

  const sendMessage = useCallback(() => {
    bc.postMessage("button clicked in A");
  }, [bc]);

  return (
    <div>
      <Button onClick={sendMessage}>Post a message</Button>
    </div>
  );
};
