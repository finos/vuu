import { useCallback, useRef, useState } from "react";
import { fetchManifest, type ManifestResult } from "./remote-check";

export interface RemoteChecks {
  /** Manifest results by remote URL. */
  manifests: Readonly<Record<string, ManifestResult>>;
  check: (mfUrls: readonly string[]) => Promise<void>;
  lastCheckedAt?: number;
}

/** Fetches remote manifests from this browser. Results are not persisted. */
export const useRemoteChecks = (fetchImpl?: typeof fetch): RemoteChecks => {
  const [manifests, setManifests] = useState<Record<string, ManifestResult>>(
    {},
  );
  const [lastCheckedAt, setLastCheckedAt] = useState<number>();
  const pending = useRef(new Set<string>());

  const check = useCallback(
    async (mfUrls: readonly string[]) => {
      const urls = [...new Set(mfUrls.filter(Boolean))].filter(
        (url) => !pending.current.has(url),
      );
      if (urls.length === 0) return;
      for (const url of urls) pending.current.add(url);
      setManifests((current) => ({
        ...current,
        ...Object.fromEntries(urls.map((url) => [url, { status: "checking" }])),
      }));
      await Promise.all(
        urls.map(async (url) => {
          const result = await fetchManifest(url, fetchImpl);
          pending.current.delete(url);
          setManifests((current) => ({ ...current, [url]: result }));
        }),
      );
      setLastCheckedAt(Date.now());
    },
    [fetchImpl],
  );

  return { check, lastCheckedAt, manifests };
};
