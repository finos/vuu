import type { Settings, VuuUser } from "@vuu-ui/vuu-utils";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { createContext } from "react";
import { SettingsSchema } from "../user-settings";

const Guest: VuuUser = {
  username: "unknown",
};

export interface ApplicationContextProps {
  onUserSettingChanged: (
    propertyName: string,
    value: VuuRowDataItemType,
  ) => void;
  logout?: () => void;
  userSettings?: Settings;
  userSettingsSchema?: SettingsSchema;
  user: VuuUser;
}

export const ApplicationContext = createContext<ApplicationContextProps>({
  onUserSettingChanged: (propertyName: string) =>
    console.warn(
      `Cannot change setting '${propertyName}'.\nDid you forget to declare an ApplicationProvider ?`,
    ),
  user: Guest,
});
