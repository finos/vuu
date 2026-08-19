import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { createContext } from "react";


export interface ApplicationContextProps {
  onUserSettingChanged: (
    propertyName: string,
    value: VuuRowDataItemType,
  ) => void;
  logout?: () => void;
}
console.log("%ccreate application context", "color:red;font-weight:bold;");
export const ApplicationContext = createContext<ApplicationContextProps>({
  onUserSettingChanged: (propertyName: string) =>
    console.warn(
      `Cannot change setting '${propertyName}'.\nDid you forget to declare an ApplicationProvider ?`,
    )
});
