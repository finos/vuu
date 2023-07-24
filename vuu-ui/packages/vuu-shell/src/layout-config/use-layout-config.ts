import { LayoutJSON } from "@finos/vuu-layout/src/layout-reducer";
import { useCallback, useEffect, useState } from "react";
import { VuuUser } from "../shell";
import { SaveLocation } from "../shellTypes";
import { loadLocalConfig, saveLocalConfig } from "./local-config";
import { loadRemoteConfig, saveRemoteConfig } from "./remote-config";

export interface LayoutConfigHookProps {
  defaultLayout: LayoutJSON;
  saveLocation: SaveLocation;
  saveUrl?: string;
  user: VuuUser;
}

export type LayoutHookResult = [
  LayoutJSON,
  (layout: LayoutJSON) => void,
  (id: string) => void
];

export const useLayoutConfig = ({
  saveLocation,
  saveUrl = "api/vui",
  user,
  defaultLayout,
}: LayoutConfigHookProps): LayoutHookResult => {
  const [layout, _setLayout] = useState(defaultLayout);
  const usingRemote = saveLocation === "remote";
  const loadConfig = usingRemote ? loadRemoteConfig : loadLocalConfig;
  const saveConfig = usingRemote ? saveRemoteConfig : saveLocalConfig;

  const load = useCallback(
    async (id = "latest") => {
      try {
        const layout = await loadConfig(saveUrl, user, id);
        _setLayout(layout);
      } catch {
        _setLayout(defaultLayout);
      }
    },
    [defaultLayout, loadConfig, saveUrl, user]
  );

  useEffect(() => {
    load();
  }, [load]);

  const saveData = useCallback(
    (data) => {
      saveConfig(saveUrl, user, data);
    },
    [saveConfig, saveUrl, user]
  );

  const loadLayoutById = useCallback((id) => load(id), [load]);

  return [layout, saveData, loadLayoutById];
};
