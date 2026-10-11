import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  decodeExampleProps,
  EXAMPLE_ACTION_MESSAGE,
  EXAMPLE_PROPS_MESSAGE,
  type ExamplePropDefs,
  type ExamplePropValue,
  type ExamplePropValues,
  encodeExampleProps,
  getExamplePropDefs,
  PROPS_PARAM,
  sanitiseExampleProps,
  withoutDefaults,
} from "../../example-props";

export interface ActionLogEntry {
  args: string;
  id: number;
  name: string;
  time: number;
}

const MAX_LOG_ENTRIES = 50;
const PANEL_STORAGE_KEY = "vuu-showcase.propsPanel";

/**
 * Messages are accepted only from the main preview iframe, not from compare
 * cells or examples embedded in a document. Frames are same origin, so the
 * sending iframe element is accessible.
 */
const isFromPreview = (source: MessageEventSource | null) => {
  try {
    const frame = (source as Window | null)?.frameElement;
    return frame?.closest(".ShowcasePreviewCanvas") != null;
  } catch {
    return false;
  }
};

/**
 * The props declared by the example in the preview iframe, its prop values
 * (held in the url, so a configured example can be shared) and a log of its
 * callback invocations. The example reports its declaration once loaded,
 * resetKey changes whenever the iframe is reloaded.
 */
export const useExampleProps = (resetKey: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [defs, setDefs] = useState<ExamplePropDefs>();
  const [log, setLog] = useState<ActionLogEntry[]>([]);

  useEffect(() => {
    setDefs(undefined);
    setLog([]);
    let nextId = 0;
    const handleMessage = (evt: MessageEvent) => {
      if (evt.origin !== window.location.origin || !isFromPreview(evt.source))
        return;
      const { data } = evt;
      if (data?.type === EXAMPLE_PROPS_MESSAGE) {
        setDefs(getExamplePropDefs(data.defs));
      } else if (data?.type === EXAMPLE_ACTION_MESSAGE) {
        const entry: ActionLogEntry = {
          args: String(data.args ?? ""),
          id: nextId++,
          name: String(data.name),
          time: Date.now(),
        };
        setLog((entries) => [entry, ...entries].slice(0, MAX_LOG_ENTRIES));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [resetKey]);

  const encoded = searchParams.get(PROPS_PARAM);
  const values = defs
    ? sanitiseExampleProps(defs, decodeExampleProps(encoded))
    : {};

  const writeValues = useCallback(
    (nextValues: ExamplePropValues) =>
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          const value = encodeExampleProps(nextValues);
          if (value) {
            next.set(PROPS_PARAM, value);
          } else {
            next.delete(PROPS_PARAM);
          }
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setValue = useCallback(
    (name: string, value: ExamplePropValue) => {
      if (defs) {
        const current = sanitiseExampleProps(defs, decodeExampleProps(encoded));
        writeValues(withoutDefaults(defs, { ...current, [name]: value }));
      }
    },
    [defs, encoded, writeValues],
  );

  const reset = useCallback(() => writeValues({}), [writeValues]);
  const clearLog = useCallback(() => setLog([]), []);

  return { clearLog, defs, log, reset, setValue, values };
};

const loadPanelOpen = () => {
  try {
    return localStorage.getItem(PANEL_STORAGE_KEY) !== "closed";
  } catch {
    return true;
  }
};

/** Open state of the Props panel, persisted as a preference */
export const usePropsPanelOpen = () => {
  const [open, setOpen] = useState(loadPanelOpen);
  const toggle = useCallback(
    () =>
      setOpen((current) => {
        try {
          localStorage.setItem(PANEL_STORAGE_KEY, current ? "closed" : "open");
        } catch {
          // storage unavailable
        }
        return !current;
      }),
    [],
  );
  return [open, toggle] as const;
};
