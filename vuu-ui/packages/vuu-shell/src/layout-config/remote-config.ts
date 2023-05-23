import { LayoutJSON } from "@finos/vuu-layout/src/layout-reducer";
import { VuuUser } from "../shell";

export const loadRemoteConfig = (
  saveUrl: string,
  user: VuuUser,
  id = "latest"
): Promise<LayoutJSON> =>
  new Promise((resolve, reject) => {
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
  user: VuuUser,
  data: LayoutJSON
) =>
  new Promise((resolve, reject) => {
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
