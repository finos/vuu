import { createContext, useContext } from "react";

export const EditingContext = createContext<(editing: boolean) => void>(
  () => undefined,
);
export const useEditingLock = () => useContext(EditingContext);
