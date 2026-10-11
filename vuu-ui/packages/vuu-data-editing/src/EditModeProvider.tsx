import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface EditModeContextProps {
  isEditMode: boolean;
  setEditMode: (inEditMode: boolean) => void;
}

let warnedMissingProvider = false;

const EditModeContext = createContext<EditModeContextProps>({
  isEditMode: false,
  setEditMode: () => {
    if (process.env.NODE_ENV !== "production" && !warnedMissingProvider) {
      warnedMissingProvider = true;
      console.warn(
        "[useEditMode] setEditMode called with no EditModeProvider in scope, edit mode will not change",
      );
    }
  },
});

/**
 * Shares a view/edit mode flag between components that are rendered apart,
 * e.g. a toolbar toggle and an edit form. Implemented as a standalone Provider
 * so that edit mode can be controlled above the individual edit controls.
 *
 * `isEditMode` seeds (and resets) the mode; descendants can change it with
 * `useEditMode().setEditMode`.
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

  const value = useMemo(() => ({ isEditMode, setEditMode }), [isEditMode]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
};

/**
 * Returns the edit mode from the nearest EditModeProvider. With no provider,
 * `isEditMode` is always false.
 */
export const useEditMode = () => useContext(EditModeContext);
