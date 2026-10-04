import { createContext, type ReactNode, useContext } from "react";
import type { TableEditSession } from "./TableEditSession";

const DataEditingContext = createContext<TableEditSession | undefined>(
  undefined,
);

export const DataEditingProvider = ({
  children,
  editSession,
}: {
  children: ReactNode;
  editSession: TableEditSession;
}) => {
  return (
    <DataEditingContext.Provider value={editSession}>
      {children}
    </DataEditingContext.Provider>
  );
};

export function useEditSession(
  throwIfUnavailable?: false,
): TableEditSession | undefined;
export function useEditSession(throwIfUnavailable: true): TableEditSession;
export function useEditSession(throwIfUnavailable = false) {
  const editSession = useContext(DataEditingContext);
  if (editSession === undefined) {
    if (throwIfUnavailable) {
      throw Error(
        "[useEditSession] no DataEditingContext in scope. You need to enclose editable component(s) with DataEditingProvider",
      );
    }
  } else {
    return editSession;
  }
}
