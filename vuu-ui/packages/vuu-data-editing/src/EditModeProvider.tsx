import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
export const EditModeProvider = ({
  children,
  isEditMode: isEditModeProp = false,
}: {
  children: ReactNode;
  isEditMode?: boolean;
}) => {
  const [isEditMode, setEditMode] = useState(isEditModeProp);

  useEffect(() => {
    setEditMode(isEditModeProp);
  }, [isEditModeProp]);

  return (
    <EditModeContext.Provider value={{ isEditMode, setEditMode }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
