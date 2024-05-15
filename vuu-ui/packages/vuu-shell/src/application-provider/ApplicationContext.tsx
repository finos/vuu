import type { ThemeMode, VuuUser } from "@finos/vuu-utils";
import { createContext } from "react";

export interface CoreSettings {
  themeMode: ThemeMode;
}

const Guest: VuuUser = {
  username: "unknown",
  token: "",
};

export interface ApplicationContextProps {
  changeSetting: (propertyName: string, value: unknown) => void;
  settings: CoreSettings;
  user: VuuUser;
}

export const ApplicationContext = createContext<ApplicationContextProps>({
  changeSetting: (propertyName: string) =>
    console.log(
      `Cannot change setting '${propertyName}'.\nDid you forget to declare an ApplicationProvider ?`
    ),
  settings: {
    themeMode: "light",
  },
  user: Guest,
});
