import { SaveLocation } from "@finos/vuu-shell";
import {
  getAllLocalEntity,
  getLocalEntity,
  saveLocalEntity,
  uuid,
} from "@finos/vuu-utils";
import { useCallback } from "react";

type EntityStoreProps = {
  baseUrl: string;
  saveLocation: SaveLocation;
};

export const useRestEntityStore = <T>({
  baseUrl,
  saveLocation,
}: EntityStoreProps) => {
  const usingLocal = saveLocation === "local";

  const getAll = useCallback(async (): Promise<T[] | undefined> => {
    if (usingLocal) return getAllLocalEntity(baseUrl);
    try {
      const response = await fetch(baseUrl, {});
      if (response.ok) {
        return await response.json();
      }
    } catch {
      console.error(`Failed to load entity at ${baseUrl}`);
    }
  }, [baseUrl, usingLocal]);

  const get = useCallback(
    async (id: string): Promise<T | undefined> => {
      if (usingLocal) return getLocalEntity(`${baseUrl}/${id}`);
      try {
        const response = await fetch(`${baseUrl}/${id}`, {});
        if (response.ok) {
          return await response.json();
        }
      } catch {
        console.error(`Failed to load entity at ${baseUrl}/${id}`);
      }
    },
    [baseUrl, usingLocal]
  );

  const save = useCallback(
    async (data: T): Promise<T | undefined> => {
      if (usingLocal) return saveLocalEntity(`${baseUrl}/${uuid()}`, data);
      try {
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch {
        console.error(`Failed to save entity at ${baseUrl}`);
      }
    },
    [baseUrl, usingLocal]
  );

  return { getAll, get, save };
};
