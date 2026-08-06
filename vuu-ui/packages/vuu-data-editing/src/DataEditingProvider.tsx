import { createContext, ReactNode, useContext } from "react";
import { EditSession } from "./EditSession";

const DataEditingContext = createContext<EditSession | undefined>(undefined);

export const DataEditingProvider = ({
  children,
  editSession,
}: {
  children: ReactNode;
  editSession: EditSession;
}) => {
  return (
    <DataEditingContext.Provider value={editSession}>
      {children}
    </DataEditingContext.Provider>
  );
};

export function useEditSession(
  throwIfUnavailable?: false,
): EditSession | undefined;
export function useEditSession(throwIfUnavailable: true): EditSession;
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
