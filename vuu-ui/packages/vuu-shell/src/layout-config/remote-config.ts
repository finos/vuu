import { LayoutJSON } from "@finos/vuu-layout/src/layout-reducer";
import { VuuUser } from "../shell";

export const loadRemoteConfig = (
  saveUrl: string,
  user: VuuUser | undefined,
  id = "latest"
): Promise<LayoutJSON> =>
  new Promise((resolve, reject) => {
    if (user === undefined) {
      throw Error("user mustb be provided to load remote config");
    }
    fetch(`${saveUrl}/${user.username}/${id}`, {})
      .then((response) => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(undefined);
        }
      })
      .catch(() => {
        // TODO we should set a layout with a warning here
        //   setLayout(defaultLayout);
        reject(undefined);
      });
  });

export const saveRemoteConfig = (
  saveUrl: string,
  user: VuuUser | undefined,
  data: LayoutJSON
) =>
  new Promise((resolve, reject) => {
    if (user === undefined) {
      throw Error("user mustb be provided to load remote config");
    }
    fetch(`${saveUrl}/${user.username}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((response) => {
      if (response.ok) {
        resolve(undefined);
      } else {
        reject();
      }
    });
  });
