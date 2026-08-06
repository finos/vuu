import { createContext, ReactNode, useContext, useState } from "react";

export interface EditModeContextProps {
  isEditMode: boolean;
  setEditMode: (inEditMode: boolean) => void;
}

const EditModeContext = createContext<EditModeContextProps>({
  isEditMode: false,
  setEditMode: () => "EditModeProvider in place",
});

/**
 * Implemented as a standalone Provider so that EditMode cna be implemented
 * at higher level than individual edit controls.
 */
export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setEditMode] = useState(false);
  return (
    <EditModeContext.Provider value={{ isEditMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
