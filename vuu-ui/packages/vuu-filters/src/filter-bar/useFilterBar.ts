import { MenuActionHandler } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { ColumnDescriptorsByName, Filter } from "@finos/vuu-filter-types";
import { PromptProps } from "@finos/vuu-popups";
import {
  EditableLabelProps,
  EditAPI,
  NullEditAPI,
} from "@finos/vuu-ui-controls";
import { getElementDataIndex, queryClosest } from "@finos/vuu-utils";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterPillProps } from "../filter-pill";
import { FilterMenuOptions } from "../filter-pill-menu";
import { FilterBarProps } from "./FilterBar";
import { useFilterState } from "./useFilterState";
import { useApplyFilterOnChange } from "./useApplyFilterOnChange";
import {
  FilterEditCancelHandler,
  FilterEditSaveHandler,
} from "../filter-editor";
import { navigateToNextItem } from "./filterBarFocusManagement";

type InteractedFilterState = {
  filter?: Filter;
  index: number;
  state: "create" | "edit" | "rename";
};

export interface FilterBarHookProps
  extends Pick<
    FilterBarProps,
    | "columnDescriptors"
    | "defaultFilterState"
    | "filterState"
    | "onApplyFilter"
    | "onFilterDeleted"
    | "onFilterRenamed"
    | "onFilterStateChanged"
  > {
  containerRef: RefObject<HTMLDivElement>;
}

export const useFilterBar = ({
  columnDescriptors,
  containerRef,
  defaultFilterState,
  filterState,
  onApplyFilter,
  onFilterDeleted,
  onFilterRenamed,
  onFilterStateChanged,
}: FilterBarHookProps) => {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [interactedFilterState, setInteractedFilterState] = useState<
    InteractedFilterState | undefined
  >();
  const [promptProps, setPromptProps] = useState<PromptProps | null>(null);
  const editPillLabelAPI = useRef<EditAPI>(NullEditAPI);

  const columnsByName = useMemo(
    () => columnDescriptorsByName(columnDescriptors),
    [columnDescriptors]
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

  //TODO do we need it ?
  useApplyFilterOnChange({
    activeFilterIndex,
    columnsByName,
    filters,
    onApplyFilter,
  });

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
          `.vuuFilterPill[data-index="${index}"] button`
        ) as undefined | HTMLInputElement;
        if (target) {
          target.focus();
        }
      });
    },
    [containerRef]
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
    [filters.length, focusFilterPill, onDeleteFilter]
  );

  const getDeletePrompt = useMemo(
    () => (filter: Filter) => {
      const close = () => {
        setPromptProps(null);
        focusFilterPill();
      };
      return {
        confirmButtonLabel: "Remove",
        icon: "warn-triangle",
        onCancel: close,
        onClose: close,
        onConfirm: () => {
          setPromptProps(null);
          deleteConfirmed(filter);
        },
        text: `Are you sure you want to delete  ${filter.name}`,
        title: "Remove Filter",
        variant: "warn",
      } as PromptProps;
    },
    [deleteConfirmed, focusFilterPill]
  );

  const deleteFilter = useCallback(
    (filter: Filter, withPrompt: boolean) => {
      if (withPrompt) {
        setPromptProps(getDeletePrompt(filter));
      } else {
        deleteConfirmed(filter);
      }
    },
    [deleteConfirmed, getDeletePrompt]
  );

  // const handleBeginEditFilterName = useCallback((filter: Filter) => {
  //   editingFilterRef.current = filter;
  // }, []);

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
      [focusFilterPill, interactedFilterState, onRenameFilter]
    );

  const handlePillMenuAction = useCallback<MenuActionHandler>(
    ({ menuId, options }) => {
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
    [deleteFilter, editPillLabel, filters]
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
    [editPillLabel, focusFilterPill, onAddFilter, onChangeFilter]
  );

  const filterSaveHandler = useCallback<FilterEditSaveHandler>(
    (filter) => {
      if (interactedFilterState) {
        const { filter: existingFilter } = interactedFilterState;
        setInteractedFilterState(undefined);
        addIfNewElseUpdate(filter, existingFilter);
      }
    },
    [addIfNewElseUpdate, interactedFilterState]
  );

  const handlePillClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      const isEditing = (e.target as HTMLElement).querySelector(
        ".vuuEditableLabel-editing"
      );
      if (!isEditing) {
        const pill = queryClosest(e.target, ".vuuFilterPill");
        if (pill) {
          const index = getElementDataIndex(pill);
          onToggleFilterActive(index, e.shiftKey);
        }
      }
    },
    [onToggleFilterActive]
  );

  const pillProps: Omit<FilterPillProps, "filter" | "selected"> = {
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
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    filters,
    interactedFilterState,
    onCancelEdit: handleCancelEdit,
    onSave: filterSaveHandler,
    pillProps,
    promptProps,
  };
};

function columnDescriptorsByName(
  columns: ColumnDescriptor[]
): ColumnDescriptorsByName {
  return columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
}
