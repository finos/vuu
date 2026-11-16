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
 * The editing state shared by everything inside a `DataEditingProvider`,
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
 * How the editable component inside a `DataEditingProvider` enters and
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

export interface DataEditingSessionProviderProps {
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

export type DataEditingProviderProps =
  | DataEditingSessionProviderProps
  | DataEditingModeProviderProps;

const SessionProvider = ({
  children,
  editSession,
}: DataEditingSessionProviderProps) => (
  <DataEditingContext.Provider value={editSession}>
    {children}
  </DataEditingContext.Provider>
);

let warnedSecondEditor = false;

const ModeProvider = ({
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
            "[DataEditingProvider] more than one editable component registered, only the last one is controlled",
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
 * Shares editing state with the edit controls inside it.
 *
 * - With `editSession`: provides that session, e.g. to the cells of a Table.
 * - Without `editSession`: owns the editing mode (view, edit or create) of
 *   an editable component, e.g. an `EditableTable`, and shares it with
 *   controls placed anywhere inside, e.g. an `EditModeToggle` in a page
 *   header. The editable component registers how it enters and leaves edit
 *   mode, and its edit session, which `useEditSession` then returns. Read
 *   the state with `useDataEditing`. `useEditMode` follows the mode too.
 */
export const DataEditingProvider = (props: DataEditingProviderProps) =>
  "editSession" in props ? (
    <SessionProvider {...props} />
  ) : (
    <ModeProvider {...props} />
  );

/**
 * The editing state of the enclosing `DataEditingProvider` (without
 * `editSession`), or undefined if there is none.
 */
export const useDataEditingControl = () =>
  useContext(DataEditingControlContext);

/**
 * The editing state of the enclosing `DataEditingProvider`. Throws if there
 * is none.
 */
export const useDataEditing = (componentName = "useDataEditing") => {
  const control = useContext(DataEditingControlContext);
  if (control === undefined) {
    throw Error(`${componentName} must be used within a DataEditingProvider`);
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
    throw Error(`${componentName} must be used within a DataEditingProvider`);
  }
  return control;
};

/**
 * For an editable component: the mode of the enclosing `DataEditingProvider`
 * and `setMode`, which changes it directly. Register how the component
 * enters and leaves edit mode with `useDataEditingEditor`.
 */
export const useDataEditingMode = (componentName: string) => {
  const { mode, registry } = useControl(componentName);
  return { mode, setMode: registry.setMode };
};

/**
 * Called by an editable component to register with the enclosing
 * `DataEditingProvider`, which then routes mode changes, e.g. from an
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
 * Returns the EditSession provided by an enclosing DataEditingProvider. If the
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
