import {
  EditSession,
  useEditSession,
  withDataRowEditErrors,
  type NewRowState,
} from "@vuu-ui/vuu-data-editing";
import type { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  getCellRenderer,
  isDataValueEditable,
  isNotHidden,
} from "@vuu-ui/vuu-utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

const createSyntheticDataRow = (
  newRowState: NewRowState,
  columns: RuntimeColumnDescriptor[],
): DataRow =>
  withDataRowEditErrors(
    {
      ...newRowState.values,
      childCount: 0,
      depth: 1,
      hasColumn: (name: string) =>
        columns.some((column) => column.name === name),
      index: -1,
      isExpanded: false,
      isLeaf: true,
      isSelected: false,
      key: EditSession.newRowKey,
      renderIndex: -1,
    } as DataRow,
    newRowState.errors,
  );

export interface UseInlineAddRowProps {
  columns: RuntimeColumnDescriptor[];
}

export const useInlineAddRow = ({ columns }: UseInlineAddRowProps) => {
  const editSession = useEditSession(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inlineAddColumns = useMemo(
    () =>
      columns.map((column) => {
        const editable = isDataValueEditable(column, "insert");
        const inlineAddColumn = { ...column, editable };
        return {
          ...inlineAddColumn,
          CellRenderer: editable ? getCellRenderer(inlineAddColumn) : undefined,
        };
      }),
    [columns],
  );
  const visibleColumns = useMemo(
    () => inlineAddColumns.filter(isNotHidden),
    [inlineAddColumns],
  );
  const visibleInsertColumns = useMemo(
    () =>
      visibleColumns.filter((column) => isDataValueEditable(column, "insert")),
    [visibleColumns],
  );
  const subscribeToNewRow = useCallback(
    (onStoreChange: () => void) => {
      editSession.on("newRow", onStoreChange);
      return () => editSession.removeListener("newRow", onStoreChange);
    },
    [editSession],
  );
  const newRowState = useSyncExternalStore(
    subscribeToNewRow,
    () => editSession.newRowState,
    () => editSession.newRowState,
  );
  const dataRow = useMemo(
    () => createSyntheticDataRow(newRowState, inlineAddColumns),
    [inlineAddColumns, newRowState],
  );
  const previousValuesRef = useRef(newRowState.values);

  const focusEditor = useCallback((index: number) => {
    const cell =
      containerRef.current?.querySelectorAll<HTMLElement>("[data-field]")[
      index
      ];
    cell?.querySelector<HTMLElement>("input, button, [tabindex]")?.focus();
  }, []);

  useEffect(() => {
    editSession.configureNewRow(visibleInsertColumns.map(({ name }) => name));
  }, [editSession, visibleInsertColumns]);

  useEffect(() => {
    visibleInsertColumns
      .filter(
        (column) =>
          column.serverDataType === "boolean" &&
          newRowState.values[column.name] === undefined,
      )
      .forEach((column) => {
        editSession.setNewRowValue(column.name, false);
      });
  }, [editSession, newRowState.values, visibleInsertColumns]);

  useEffect(() => {
    const firstInvalidIndex = visibleColumns.findIndex(
      ({ name }) => newRowState.errors[name] !== undefined,
    );
    if (firstInvalidIndex !== -1) {
      focusEditor(firstInvalidIndex);
    }
  }, [focusEditor, newRowState.errors, visibleColumns]);

  useEffect(() => {
    const previousValues = previousValuesRef.current;
    previousValuesRef.current = newRowState.values;
    if (
      Object.keys(previousValues).length > 0 &&
      Object.keys(newRowState.values).length === 0 &&
      Object.keys(newRowState.errors).length === 0
    ) {
      const firstEditableIndex = visibleColumns.findIndex((column) =>
        isDataValueEditable(column, "insert"),
      );
      if (firstEditableIndex !== -1) {
        requestAnimationFrame(() => focusEditor(firstEditableIndex));
      }
    }
  }, [focusEditor, newRowState.errors, newRowState.values, visibleColumns]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleCommit = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const cell = target.closest<HTMLElement>("[data-field]");
      const cells = container.querySelectorAll<HTMLElement>("[data-field]");
      const currentIndex = Array.from(cells).indexOf(cell ?? container);
      const firstEditableIndex = visibleColumns.findIndex((column) =>
        isDataValueEditable(column, "insert"),
      );
      const nextEditableIndex = visibleColumns.findIndex(
        (column, index) =>
          index > currentIndex && isDataValueEditable(column, "insert"),
      );
      if (nextEditableIndex !== -1) {
        focusEditor(nextEditableIndex);
      } else if (firstEditableIndex !== -1) {
        requestAnimationFrame(() => focusEditor(firstEditableIndex));
      }
    };

    container.addEventListener("vuu-commit", handleCommit);
    return () => container.removeEventListener("vuu-commit", handleCommit);
  }, [focusEditor, visibleColumns]);

  return {
    containerRef,
    dataRow,
    inlineAddColumns,
  };
};
