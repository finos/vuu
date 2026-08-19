import type { ReactNode } from "react";
import {
  ApplicationModelContext,
  useLoadApplicationModel,
} from "./useApplicationModel";

export const ApplicationModelProvider = ({
  children,
}: {
  children: ReactNode;
}) => (
  <ApplicationModelContext.Provider value={useLoadApplicationModel()}>
    {children}
  </ApplicationModelContext.Provider>
);
