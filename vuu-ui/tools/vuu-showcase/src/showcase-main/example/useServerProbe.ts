import { useCallback, useEffect, useRef, useState } from "react";

export type ServerStatus = "unknown" | "checking" | "reachable" | "unreachable";

export const PROBE_TIMEOUT = 3000;

/** Resolves true if a websocket connection to url can be opened */
export const probeWebSocket = (
  url: string,
  timeout = PROBE_TIMEOUT,
): Promise<boolean> =>
  new Promise((resolve) => {
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      resolve(false);
      return;
    }
    const finish = (reachable: boolean) => {
      clearTimeout(timer);
      socket.onopen = socket.onerror = socket.onclose = null;
      if (socket.readyState <= WebSocket.OPEN) {
        socket.close();
      }
      resolve(reachable);
    };
    const timer = setTimeout(() => finish(false), timeout);
    socket.onopen = () => finish(true);
    socket.onerror = () => finish(false);
    socket.onclose = () => finish(false);
  });

/** Status of a server, refreshed each time probe is called */
export const useServerProbe = (url: string) => {
  const [status, setStatus] = useState<ServerStatus>("unknown");
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const probe = useCallback(() => {
    if (pending.current) {
      return;
    }
    pending.current = true;
    setStatus((current) => (current === "unknown" ? "checking" : current));
    probeWebSocket(url).then((reachable) => {
      pending.current = false;
      if (mounted.current) {
        setStatus(reachable ? "reachable" : "unreachable");
      }
    });
  }, [url]);

  return { probe, status };
};
