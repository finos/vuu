import { createContext, ReactNode, useContext } from "react";
import { EditTracker } from "./EditTracker";

const DataEditingContext = createContext<EditTracker | undefined>(undefined);

export const DataEditingProvider = ({
  children,
  editTracker,
}: {
  children: ReactNode;
  editTracker: EditTracker;
}) => {
  return (
    <DataEditingContext.Provider value={editTracker}>
      {children}
    </DataEditingContext.Provider>
  );
};

export function useEditTracker(
  throwIfUnavailable?: false,
): EditTracker | undefined;
export function useEditTracker(throwIfUnavailable: true): EditTracker;
export function useEditTracker(throwIfUnavailable = false) {
  const editTracker = useContext(DataEditingContext);
  if (editTracker === undefined) {
    if (throwIfUnavailable) {
      throw Error(
        "[useEditTracker] no DataEditingContext in scope. You need to enclose editable component(s) with DataEditingProvider",
      );
    }
  } else {
    return editTracker;
  }
}
