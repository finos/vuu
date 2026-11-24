import {
  EditSession,
  useEditSession,
  withDataRowEditErrors,
  type NewRowState,
  type RowDefaultDataItemValues,
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

/**
 * The row being added: the values entered, over the row defaults it will be
 * added with, so a column that is not entered shows its default.
 */
const createSyntheticDataRow = (
  newRowState: NewRowState,
  rowDefaults: Readonly<RowDefaultDataItemValues>,
  columns: RuntimeColumnDescriptor[],
): DataRow =>
  withDataRowEditErrors(
    {
      ...rowDefaults,
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
    () =>
      createSyntheticDataRow(
        newRowState,
        editSession.rowDefaults,
        inlineAddColumns,
      ),
    [editSession, inlineAddColumns, newRowState],
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
    editSession.configureNewRow(
      visibleInsertColumns.map(({ name }) => name),
      visibleInsertColumns
        .filter((column) => column.required !== false)
        .map(({ name }) => name),
    );
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

    const moveFocusFrom = (target: Element) => {
      const cell = target.closest<HTMLElement>("[data-field]");
      const cells = container.querySelectorAll<HTMLElement>("[data-field]");
      const currentIndex = Array.from(cells).indexOf(cell ?? container);
      const firstInvalidIndex = visibleColumns.findIndex(
        ({ name }) => editSession.newRowState.errors[name] !== undefined,
      );
      const firstEditableIndex = visibleColumns.findIndex((column) =>
        isDataValueEditable(column, "insert"),
      );
      const nextEditableIndex = visibleColumns.findIndex(
        (column, index) =>
          index > currentIndex && isDataValueEditable(column, "insert"),
      );
      if (firstInvalidIndex !== -1) {
        focusEditor(firstInvalidIndex);
      } else if (nextEditableIndex !== -1) {
        focusEditor(nextEditableIndex);
      } else if (firstEditableIndex !== -1) {
        requestAnimationFrame(() => focusEditor(firstEditableIndex));
      }
    };

    // Enter in a cell adds the row once its required columns are filled,
    // whether or not the cell had a change to commit. Enter in the final
    // cell always tries to add it, which flags the required values still
    // missing. Tab, or a value chosen from a list, only moves on to the next
    // cell.
    const isFinalCell = (target: Element) => {
      const field = target.closest<HTMLElement>("[data-field]")?.dataset.field;
      return field !== undefined && editSession.isNewRowFinalColumn(field);
    };
    /** Returns true when the row is added. */
    const submitNewRow = (target: Element) => {
      if (editSession.isNewRowComplete()) {
        editSession.addNewRow();
        return true;
      }
      if (isFinalCell(target)) {
        editSession.addNewRow();
      }
      return false;
    };

    let enterTarget: EventTarget | null = null;
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, target } = event;
      if (
        key === "Enter" &&
        target instanceof Element &&
        target.closest('[role="combobox"], [role="listbox"]') === null
      ) {
        enterTarget = target;
        // A cell commits its change during the keydown. Wait for it, then
        // submit the row if the cell had nothing to commit.
        setTimeout(() => {
          if (enterTarget === target) {
            enterTarget = null;
            if (!submitNewRow(target) && isFinalCell(target)) {
              moveFocusFrom(target);
            }
          }
        });
      } else {
        enterTarget = null;
      }
    };

    const handleCommit = (event: Event) => {
      const target = event.target;
      const isEnter = target === enterTarget;
      enterTarget = null;
      if (!(target instanceof Element)) {
        return;
      }
      if (isEnter && submitNewRow(target)) {
        return;
      }
      moveFocusFrom(target);
    };

    container.addEventListener("keydown", handleKeyDown, true);
    container.addEventListener("vuu-commit", handleCommit);
    return () => {
      container.removeEventListener("keydown", handleKeyDown, true);
      container.removeEventListener("vuu-commit", handleCommit);
    };
  }, [editSession, focusEditor, visibleColumns]);

  return {
    containerRef,
    dataRow,
    draftRevision: newRowState.draftRevision,
    inlineAddColumns,
  };
};
