import { ColumnDescriptorsByName, Filter } from "@vuu-ui/vuu-filter-types";
import { PromptProps } from "@vuu-ui/vuu-ui-controls";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  EditableLabelProps,
  EditAPI,
  NullEditAPI,
} from "@vuu-ui/vuu-ui-controls";
import { getElementDataIndex, queryClosest } from "@vuu-ui/vuu-utils";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterBarProps } from "../filter-bar";
import {
  FilterEditCancelHandler,
  FilterEditSaveHandler,
} from "../filter-editor";
import { FilterPillProps } from "../filter-pill";
import { FilterMenuOptions } from "../filter-pill-menu";
import { navigateToNextItem } from "./filterBarFocusManagement";
import { useFilterState } from "./useFilterState";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";

export type EditFilterState = "create" | "edit";
export type FilterState = EditFilterState | "rename";
export const isEditFilterState = (
  filterState?: string,
): filterState is EditFilterState =>
  filterState === "edit" || filterState === "create";

type InteractedFilterState = {
  filter?: Filter;
  index: number;
  state: FilterState;
};

export interface CustomFilterHookProps
  extends Pick<
    FilterBarProps,
    | "columnDescriptors"
    | "defaultFilterState"
    | "filterState"
    | "onApplyFilter"
    | "onClearFilter"
    | "onFilterDeleted"
    | "onFilterRenamed"
    | "onFilterStateChanged"
  > {
  containerRef: RefObject<HTMLDivElement | null>;
}

export const useCustomFilters = ({
  columnDescriptors,
  containerRef,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onClearFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
}: CustomFilterHookProps) => {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [interactedFilterState, setInteractedFilterState] = useState<
    InteractedFilterState | undefined
  >();
  const [promptProps, setPromptProps] = useState<PromptProps | null>(null);
  const editPillLabelAPI = useRef<EditAPI>(NullEditAPI);

  const columnsByName = useMemo(
    () => columnDescriptorsByName(columnDescriptors),
    [columnDescriptors],
  );

  const {
    activeFilterIndex,
    filters,
    onAddFilter,
    onChangeFilter,
    onDeleteFilter,
    onRenameFilter,
    onToggleFilterActive,
  } = useFilterState({
    defaultFilterState,
    filterState,
    onFilterDeleted,
    onFilterRenamed,
    onFilterStateChanged,
  });

  useEffect(() => {
    const activeFilters = activeFilterIndex.map((i) => filters[i]);
    const applyFilter = (filter?: Filter) => {
      if (filter) {
        onApplyFilter(filter);
      } else {
        onClearFilter();
      }
    };
    if (activeFilters.length === 0) {
      applyFilter();
    } else if (activeFilters.length === 1) {
      const [filter] = activeFilters;
      applyFilter(filter);
    } else {
      applyFilter({ op: "and", filters: activeFilters });
    }
  }, [activeFilterIndex, columnsByName, filters, onApplyFilter, onClearFilter]);

  const editPillLabel = useCallback((index: number, filter: Filter) => {
    setTimeout(() => {
      setInteractedFilterState({
        filter,
        index,
        state: "rename",
      });
    }, 100);
  }, []);

  const focusFilterPill = useCallback(
    (index = 0) => {
      requestAnimationFrame(() => {
        const target = containerRef.current?.querySelector(
          `.vuuFilterPill[data-index="${index}"] button`,
        ) as undefined | HTMLInputElement;
        if (target) {
          target.focus();
        }
      });
    },
    [containerRef],
  );

  const deleteConfirmed = useCallback(
    (filter: Filter) => {
      onDeleteFilter(filter);

      // TODO move focus to next/previous filter
      requestAnimationFrame(() => {
        if (filters.length) {
          focusFilterPill(0);
        }
      });
    },
    [filters.length, focusFilterPill, onDeleteFilter],
  );

  const getDeletePrompt = useMemo(
    () => (filter: Filter) => {
      const close = () => {
        setPromptProps(null);
        focusFilterPill();
      };
      return {
        className: "vuuFilterDeletePrompt",
        confirmButtonLabel: "Remove",
        icon: "warn-triangle",
        initialFocusedItem: "confirm",
        onCancel: close,
        onClose: close,
        onConfirm: () => {
          setPromptProps(null);
          deleteConfirmed(filter);
        },
        children: `Are you sure you want to delete filter '${filter.name}'`,
        title: "Remove Filter",
        status: "warning",
      } as PromptProps;
    },
    [deleteConfirmed, focusFilterPill],
  );

  const deleteFilter = useCallback(
    (filter: Filter, withPrompt: boolean) => {
      if (withPrompt) {
        setPromptProps(getDeletePrompt(filter));
      } else {
        deleteConfirmed(filter);
      }
    },
    [deleteConfirmed, getDeletePrompt],
  );

  // TODO handle cancel edit name
  const handleExitEditFilterName: EditableLabelProps["onExitEditMode"] =
    useCallback(
      (_, editedValue = "") => {
        if (
          interactedFilterState?.state === "rename" &&
          interactedFilterState.filter
        ) {
          const { filter } = interactedFilterState;
          const indexOfEditedFilter = onRenameFilter(filter, editedValue);

          setInteractedFilterState(undefined);
          focusFilterPill(indexOfEditedFilter);
        }
        setInteractedFilterState(undefined);
      },
      [focusFilterPill, interactedFilterState, onRenameFilter],
    );

  const handlePillMenuAction = useCallback<MenuActionHandler>(
    (menuId, options) => {
      switch (menuId) {
        case "delete-filter": {
          const { filter } = options as FilterMenuOptions;
          deleteFilter(filter, true);
          return true;
        }
        case "rename-filter": {
          const { filter } = options as FilterMenuOptions;
          const index = filters.indexOf(filter);
          editPillLabel(index, filter);
          return true;
        }
        case "edit-filter": {
          const { filter } = options as FilterMenuOptions;
          setInteractedFilterState({
            filter,
            index: filters.indexOf(filter),
            state: "edit",
          });
          return true;
        }
        default:
          return false;
      }
    },
    [deleteFilter, editPillLabel, filters],
  );

  const handlePillKeyDown = useCallback<KeyboardEventHandler>((e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      navigateToNextItem(e.target, e.key === "ArrowLeft" ? "bwd" : "fwd");
    }
  }, []);

  const addIfNewElseUpdate = useCallback(
    (newOrUpdatedFilter: Filter, existing: Filter | undefined) => {
      if (existing === undefined) {
        const idx = onAddFilter(newOrUpdatedFilter);
        focusFilterPill(idx);
        editPillLabel(idx, newOrUpdatedFilter);
      } else {
        const idx = onChangeFilter(existing, newOrUpdatedFilter);
        focusFilterPill(idx);
      }
    },
    [editPillLabel, focusFilterPill, onAddFilter, onChangeFilter],
  );

  const filterSaveHandler = useCallback<FilterEditSaveHandler>(
    (filter) => {
      if (interactedFilterState) {
        const { filter: existingFilter } = interactedFilterState;
        setInteractedFilterState(undefined);
        addIfNewElseUpdate(filter, existingFilter);
      }
    },
    [addIfNewElseUpdate, interactedFilterState],
  );

  const handlePillClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      const isEditing = (e.target as HTMLElement).querySelector(
        ".vuuEditableLabel-editing",
      );
      if (!isEditing) {
        const pill = queryClosest(e.target, ".vuuFilterPill");
        if (pill) {
          const index = getElementDataIndex(pill);
          onToggleFilterActive(index, e.shiftKey);
        }
      }
    },
    [onToggleFilterActive],
  );

  const FilterPillProps: Omit<FilterPillProps, "filter" | "selected"> = {
    editLabelApiRef: editPillLabelAPI,
    // onBeginEdit: handleBeginEditFilterName,
    onClick: handlePillClick,
    onKeyDown: handlePillKeyDown,
    onMenuAction: handlePillMenuAction,
    onExitEditMode: handleExitEditFilterName,
  };

  const handleClickAddButton = useCallback(() => {
    setInteractedFilterState({
      index: -1,
      state: "create",
    });
  }, []);

  const handleKeyDownAddButton = useCallback<KeyboardEventHandler>((evt) => {
    if (evt.key === "ArrowLeft") {
      navigateToNextItem(evt.target, "bwd");
    }
  }, []);

  const handleCancelEdit = useCallback<FilterEditCancelHandler>(() => {
    if (interactedFilterState) {
      const { index } = interactedFilterState;
      if (index === -1) {
        addButtonRef.current?.focus();
      } else {
        focusFilterPill(index);
      }
      setInteractedFilterState(undefined);
    }
  }, [focusFilterPill, interactedFilterState]);

  const addButtonProps = {
    ref: addButtonRef,
    onClick: handleClickAddButton,
    onKeyDown: handleKeyDownAddButton,
  };

  return {
    FilterPillProps,
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    filters,
    interactedFilterState,
    onCancelEdit: handleCancelEdit,
    onSave: filterSaveHandler,
    promptProps,
  };
};

function columnDescriptorsByName(
  columns: ColumnDescriptor[],
): ColumnDescriptorsByName {
  return columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
}
