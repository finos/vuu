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

export const useEditTracker = () => {
  const editTracker = useContext(DataEditingContext);
  if (editTracker === undefined) {
    console.warn(
      "[useEditTracker] no DataEditingContext in scope. You need to enclose editable component(s) with DataEditingProvider",
    );
  }
  return editTracker;
};
