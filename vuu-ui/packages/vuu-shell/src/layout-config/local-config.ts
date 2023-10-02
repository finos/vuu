import { LayoutJSON } from "@finos/vuu-layout/src/layout-reducer";
import { resolveJSONPath } from "@finos/vuu-layout";
import { VuuUser } from "../shell";

export const loadLocalConfig = (
  saveUrl: string,
  user?: VuuUser,
  id = "latest"
): Promise<LayoutJSON> =>
  new Promise((resolve, reject) => {
    console.log(
      `load local config at ${saveUrl} for user ${user?.username}, id ${id}`
    );
    const data = localStorage.getItem(saveUrl);
    if (data) {
      const layout = JSON.parse(data);
      resolve(layout);
    } else {
      reject();
    }
  });

export const saveLocalConfig = (
  saveUrl: string,
  user: VuuUser | undefined,
  data: LayoutJSON
): Promise<undefined> =>
  new Promise((resolve, reject) => {
    try {
      // Just for demonstration,not currently being used
      const layoutJson = resolveJSONPath(data, "#main-tabs.ACTIVE_CHILD");
      console.log(layoutJson);

      localStorage.setItem(saveUrl, JSON.stringify(data));
      resolve(undefined);
    } catch {
      reject();
    }
  });
