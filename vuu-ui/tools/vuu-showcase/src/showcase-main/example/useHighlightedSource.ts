import { useEffect, useState } from "react";
import { SHOWCASE_SOURCE_ROOT } from "./source-root";
import { type HighlightedSource, sourceUrl } from "./source-url";

const cache = new Map<string, Promise<HighlightedSource>>();

// The dev server highlights source on request, so is never cached here,
// edits are visible as soon as the source is displayed again.
const isDevServer = SHOWCASE_SOURCE_ROOT !== "";

const fetchSource = (path: string) => {
  const url = sourceUrl(path);
  let source = isDevServer ? undefined : cache.get(url);
  if (source === undefined) {
    source = fetch(url).then((response) => {
      if (!response.ok) {
        throw Error(`${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<HighlightedSource>;
    });
    source.catch(() => cache.delete(url));
    cache.set(url, source);
  }
  return source;
};

export type SourceState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { source: HighlightedSource; status: "loaded" };

export const useHighlightedSource = (path?: string): SourceState => {
  const [state, setState] = useState<SourceState>({ status: "loading" });
  useEffect(() => {
    if (!path) {
      setState({ message: "No source available", status: "error" });
      return;
    }
    let active = true;
    setState({ status: "loading" });
    fetchSource(path).then(
      (source) => active && setState({ source, status: "loaded" }),
      (err: Error) =>
        active && setState({ message: err.message, status: "error" }),
    );
    return () => {
      active = false;
    };
  }, [path]);
  return state;
};
