import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditModeContext, type EditModeContextProps } from "./EditModeProvider";
import { EditSession } from "./EditSession";
import type { TableEditSession } from "./TableEditSession";

const DataEditingContext = createContext<TableEditSession | undefined>(
  undefined,
);

/**
 * - `view`: read only.
 * - `edit`: editing.
 * - `create`: adding a new item in a form.
 */
export type DataEditingMode = "view" | "edit" | "create";

/**
 * The editing state shared by everything inside a `DataEditingModeProvider`,
 * e.g. an `EditModeToggle` in a page header and the `EditableTable` it
 * controls.
 */
export interface DataEditingState {
  /**
   * Whether the mode can be changed now. The editable component turns this
   * off, e.g. while a new row is being created.
   */
  canChangeMode: boolean;
  /**
   * Leaves edit (or create) mode, discarding changes. The editable component
   * decides how, e.g. asking for confirmation when there are unsaved changes.
   */
  cancel: () => Promise<void>;
  /** True in edit and create modes. */
  isEditing: boolean;
  mode: DataEditingMode;
  /** Enters edit mode. */
  startEdit: () => void;
}

/**
 * How the editable component inside a `DataEditingModeProvider` enters and
 * leaves edit mode. Registered with `useDataEditingEditor`.
 */
export interface DataEditingEditor {
  cancel: () => Promise<void>;
  startEdit: () => void;
}

interface DataEditingRegistry {
  registerEditor: (editor: RefObject<DataEditingEditor>) => () => void;
  setCanChangeMode: (canChangeMode: boolean) => void;
  setEditSession: (editSession: TableEditSession | undefined) => void;
  setMode: (mode: DataEditingMode) => void;
}

interface DataEditingControl extends DataEditingState {
  registry: DataEditingRegistry;
}

const DataEditingControlContext = createContext<DataEditingControl | undefined>(
  undefined,
);

export interface DataEditingProviderProps {
  children: ReactNode;
  /** Provides this session to the edit controls inside. */
  editSession: TableEditSession;
}

export interface DataEditingModeProviderProps {
  children: ReactNode;
  /** Uncontrolled initial mode. @default "view" */
  defaultMode?: DataEditingMode;
  /** Controlled mode. Pair with `onModeChange`. */
  mode?: DataEditingMode;
  onModeChange?: (mode: DataEditingMode) => void;
}

/**
 * Provides an edit session to the edit controls inside it, e.g. the cells of
 * a Table or an `EditField`. Read it with `useEditSession`.
 */
export const DataEditingProvider = ({
  children,
  editSession,
}: DataEditingProviderProps) => (
  <DataEditingContext.Provider value={editSession}>
    {children}
  </DataEditingContext.Provider>
);

let warnedSecondEditor = false;

/**
 * Owns the editing mode (view, edit or create) of an editable component,
 * e.g. an `EditableTable`, and shares it with controls placed anywhere
 * inside, e.g. an `EditModeToggle` in a page header. The editable component
 * registers how it enters and leaves edit mode, and its edit session, which
 * `useEditSession` then returns. Read the state with `useDataEditing`.
 * `useEditMode` follows the mode too.
 */
export const DataEditingModeProvider = ({
  children,
  defaultMode = "view",
  mode: modeProp,
  onModeChange,
}: DataEditingModeProviderProps) => {
  const [modeState, setModeState] = useState<DataEditingMode>(defaultMode);
  const [canChangeMode, setCanChangeMode] = useState(true);
  const [editSession, setEditSession] = useState<TableEditSession>();
  const editorRef = useRef<RefObject<DataEditingEditor> | undefined>(undefined);

  const isControlled = modeProp !== undefined;
  const mode = modeProp ?? modeState;
  const isEditing = mode !== "view";

  // read through a ref, so setMode is stable
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  const setMode = useCallback((nextMode: DataEditingMode) => {
    if (!isControlledRef.current) {
      setModeState(nextMode);
    }
    onModeChangeRef.current?.(nextMode);
  }, []);

  const registry = useMemo<DataEditingRegistry>(
    () => ({
      registerEditor: (editor) => {
        if (
          editorRef.current !== undefined &&
          process.env.NODE_ENV !== "production" &&
          !warnedSecondEditor
        ) {
          warnedSecondEditor = true;
          console.warn(
            "[DataEditingModeProvider] more than one editable component registered, only the last one is controlled",
          );
        }
        editorRef.current = editor;
        return () => {
          if (editorRef.current === editor) {
            editorRef.current = undefined;
            setCanChangeMode(true);
            setEditSession(undefined);
          }
        };
      },
      setCanChangeMode,
      setEditSession,
      setMode,
    }),
    [setMode],
  );

  const startEdit = useCallback(() => {
    const editor = editorRef.current?.current;
    if (editor) {
      editor.startEdit();
    } else {
      setMode("edit");
    }
  }, [setMode]);

  const cancel = useCallback(async () => {
    const editor = editorRef.current?.current;
    if (editor) {
      await editor.cancel();
    } else {
      setMode("view");
    }
  }, [setMode]);

  const control = useMemo<DataEditingControl>(
    () => ({ canChangeMode, cancel, isEditing, mode, registry, startEdit }),
    [canChangeMode, cancel, isEditing, mode, registry, startEdit],
  );

  const editModeValue = useMemo<EditModeContextProps>(
    () => ({
      isEditMode: isEditing,
      setEditMode: (inEditMode) => setMode(inEditMode ? "edit" : "view"),
    }),
    [isEditing, setMode],
  );

  return (
    <DataEditingControlContext.Provider value={control}>
      <EditModeContext.Provider value={editModeValue}>
        <DataEditingContext.Provider value={editSession}>
          {children}
        </DataEditingContext.Provider>
      </EditModeContext.Provider>
    </DataEditingControlContext.Provider>
  );
};

/**
 * The editing state of the enclosing `DataEditingModeProvider`, or undefined
 * if there is none.
 */
export const useDataEditingControl = () =>
  useContext(DataEditingControlContext);

/**
 * The editing state of the enclosing `DataEditingModeProvider`. Throws if
 * there is none.
 */
export const useDataEditing = (componentName = "useDataEditing") => {
  const control = useContext(DataEditingControlContext);
  if (control === undefined) {
    throw Error(
      `${componentName} must be used within a DataEditingModeProvider`,
    );
  }
  return control as DataEditingState;
};

export interface DataEditingEditorHookProps extends DataEditingEditor {
  /** @default true */
  canChangeMode?: boolean;
  /** The session the component edits through, returned by `useEditSession`. */
  editSession?: TableEditSession;
}

const useControl = (componentName: string) => {
  const control = useContext(DataEditingControlContext);
  if (control === undefined) {
    throw Error(
      `${componentName} must be used within a DataEditingModeProvider`,
    );
  }
  return control;
};

/**
 * For an editable component: the mode of the enclosing
 * `DataEditingModeProvider` and `setMode`, which changes it directly.
 * Register how the component enters and leaves edit mode with
 * `useDataEditingEditor`.
 */
export const useDataEditingMode = (componentName: string) => {
  const { mode, registry } = useControl(componentName);
  return { mode, setMode: registry.setMode };
};

/**
 * Called by an editable component to register with the enclosing
 * `DataEditingModeProvider`, which then routes mode changes, e.g. from an
 * `EditModeToggle`, through `startEdit` and `cancel`.
 */
export const useDataEditingEditor = (
  componentName: string,
  {
    canChangeMode = true,
    cancel,
    editSession,
    startEdit,
  }: DataEditingEditorHookProps,
) => {
  const { registry } = useControl(componentName);

  const editorRef = useRef<DataEditingEditor>({ cancel, startEdit });
  editorRef.current = { cancel, startEdit };

  useLayoutEffect(() => registry.registerEditor(editorRef), [registry]);
  useLayoutEffect(() => {
    registry.setCanChangeMode(canChangeMode);
  }, [canChangeMode, registry]);
  useLayoutEffect(() => {
    registry.setEditSession(editSession);
  }, [editSession, registry]);
};

/**
 * Returns the EditSession provided by an enclosing DataEditingProvider, or
 * registered with an enclosing DataEditingModeProvider. If the
 * provider holds some other TableEditSession (e.g. DirectEditSession), there is
 * no EditSession in scope and undefined is returned.
 */
export function useEditSession(
  throwIfUnavailable?: false,
): EditSession | undefined;
export function useEditSession(throwIfUnavailable: true): EditSession;
export function useEditSession(throwIfUnavailable = false) {
  const editSession = useContext(DataEditingContext);
  if (editSession instanceof EditSession) {
    return editSession;
  } else if (throwIfUnavailable) {
    throw Error(
      editSession === undefined
        ? "[useEditSession] no DataEditingContext in scope. You need to enclose editable component(s) with DataEditingProvider"
        : "[useEditSession] DataEditingProvider does not provide an EditSession",
    );
  }
}

/**
 * Returns whichever TableEditSession is provided by an enclosing
 * DataEditingProvider. Intended for use by Table cells, which commit and
 * cancel edits regardless of the type of session.
 */
export const useTableEditSession = () => useContext(DataEditingContext);
