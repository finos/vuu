import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Settings } from "@vuu-ui/vuu-utils";
import { createContext } from "react";
import type { SettingsSchema } from "../user-settings";


export interface ApplicationContextProps {
  onUserSettingChanged: (
    propertyName: string,
    value: VuuRowDataItemType,
  ) => void;
  logout?: () => void;
  userSettings?: Settings;
  userSettingsSchema?: SettingsSchema;
}
console.log("%ccreate application context", "color:red;font-weight:bold;");
export const ApplicationContext = createContext<ApplicationContextProps>({
  onUserSettingChanged: (propertyName: string) =>
    console.warn(
      `Cannot change setting '${propertyName}'.\nDid you forget to declare an ApplicationProvider ?`,
    )
});
