import {
  EditSession,
  useEditSession,
  withDataRowEditErrors,
  type NewRowState,
} from "@vuu-ui/vuu-data-editing";
import type { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { getCellRenderer, isNotHidden } from "@vuu-ui/vuu-utils";
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
  const editableColumns = useMemo(
    () =>
      columns.map((column) => {
        const editableColumn = { ...column, editable: true };
        return {
          ...editableColumn,
          CellRenderer: getCellRenderer(editableColumn),
        };
      }),
    [columns],
  );
  const visibleColumns = useMemo(
    () => editableColumns.filter(isNotHidden),
    [editableColumns],
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
    () => createSyntheticDataRow(newRowState, editableColumns),
    [editableColumns, newRowState],
  );

  const focusEditor = useCallback((index: number) => {
    const cell =
      containerRef.current?.querySelectorAll<HTMLElement>("[data-field]")[
        index
      ];
    cell?.querySelector<HTMLElement>("input, button, [tabindex]")?.focus();
  }, []);

  useEffect(() => {
    editSession.configureNewRow(visibleColumns.map(({ name }) => name));
  }, [editSession, visibleColumns]);

  useEffect(() => {
    const firstInvalidIndex = visibleColumns.findIndex(
      ({ name }) => newRowState.errors[name] !== undefined,
    );
    if (firstInvalidIndex !== -1) {
      focusEditor(firstInvalidIndex);
    }
  }, [focusEditor, newRowState.errors, visibleColumns]);

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
      if (currentIndex !== -1 && currentIndex < visibleColumns.length - 1) {
        focusEditor(currentIndex + 1);
      }
    };

    container.addEventListener("vuu-commit", handleCommit);
    return () => container.removeEventListener("vuu-commit", handleCommit);
  }, [focusEditor, visibleColumns.length]);

  return {
    containerRef,
    dataRow,
    editableColumns,
  };
};
