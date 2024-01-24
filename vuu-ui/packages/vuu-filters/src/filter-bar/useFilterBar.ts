import { MenuActionHandler } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  ColumnDescriptorsByName,
  Filter,
  FilterClause,
  FilterWithPartialClause,
} from "@finos/vuu-filter-types";
import { PromptProps } from "@finos/vuu-popups";
import {
  ActiveItemChangeHandler,
  EditableLabelProps,
  NavigationOutOfBoundsHandler,
} from "@finos/vuu-ui-controls";
import {
  dispatchMouseEvent,
  filterAsQuery,
  isMultiClauseFilter,
} from "@finos/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterClauseCancelHandler } from "../filter-clause/useFilterClauseEditor";
import { FilterPillProps } from "../filter-pill";
import { FilterMenuOptions } from "../filter-pill-menu";
import { addClause, removeLastClause, replaceClause } from "../filter-utils";
import { FilterBarProps } from "./FilterBar";
import { useFilters } from "./useFilters";

export interface FilterBarHookProps
  extends Pick<
    FilterBarProps,
    | "activeFilterIndex"
    | "columnDescriptors"
    | "filters"
    | "onApplyFilter"
    | "onChangeActiveFilterIndex"
    | "onFilterDeleted"
    | "onFilterRenamed"
    | "onFiltersChanged"
    | "showMenu"
    | "tableSchema"
  > {
  containerRef: RefObject<HTMLDivElement>;
}

const EMPTY_FILTER_CLAUSE: Partial<Filter> = {};

export const useFilterBar = ({
  activeFilterIndex: activeFilterIdexProp = [],
  containerRef,
  filters: filtersProp,
  onApplyFilter,
  onChangeActiveFilterIndex: onChangeActiveFilterIndexProp,
  onFilterDeleted,
  onFilterRenamed,
  onFiltersChanged,
  showMenu: showMenuProp,
  tableSchema,
  columnDescriptors,
}: FilterBarHookProps) => {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editingFilter = useRef<Filter | undefined>();
  const [showMenu, setShowMenu] = useState(showMenuProp);
  const [editFilter, setEditFilter] = useState<
    Partial<Filter> | FilterWithPartialClause | undefined
  >();
  const [promptProps, setPromptProps] = useState<PromptProps | null>(null);

  const columnsByName = useMemo(
    () => columnDescriptorsByName(columnDescriptors),
    [columnDescriptors]
  );

  const applyFilter = useCallback(
    (filter?: Filter) => {
      const query = filter ? filterAsQuery(filter, { columnsByName }) : "";
      onApplyFilter({ filter: query, filterStruct: filter });
    },
    [columnsByName, onApplyFilter]
  );

  const {
    activeFilterIndex,
    filters,
    onAddFilter,
    onChangeFilter,
    onDeleteFilter,
    onRenameFilter,
    onChangeActiveFilterIndex,
  } = useFilters({
    activeFilterIndex: activeFilterIdexProp,
    applyFilter,
    filters: filtersProp,
    onFilterDeleted,
    onFilterRenamed,
    onFiltersChanged,
    tableSchema,
  });

  const editPillLabel = useCallback(
    (index: number) => {
      requestAnimationFrame(() => {
        const pills = containerRef.current?.querySelectorAll(
          ".vuuFilterPill"
        ) as undefined | HTMLElement[];
        if (pills?.[index]) {
          const editableLabel = pills[index].querySelector(
            ".vuuEditableLabel"
          ) as HTMLElement;
          if (editableLabel) {
            dispatchMouseEvent(editableLabel, "dblclick");
          }
        }
      });
    },
    [containerRef]
  );

  const focusFilterClause = useCallback(
    (_ = 0) => {
      requestAnimationFrame(() => {
        const input = containerRef.current?.querySelector(
          ".vuuFilterClause .saltInput-input"
        ) as undefined | HTMLInputElement;
        if (input) {
          input.focus();
        }
      });
    },
    [containerRef]
  );

  const focusFilterPill = useCallback(
    (index?: number) => {
      requestAnimationFrame(() => {
        const target =
          typeof index === "number"
            ? (containerRef.current?.querySelector(
                `.vuuOverflowContainer-item[data-index="${index}"] .vuuFilterPill`
              ) as undefined | HTMLInputElement)
            : (containerRef.current?.querySelector(
                ".vuuFilterPill[tabindex]"
              ) as undefined | HTMLInputElement);
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

  const handleBeginEditFilterName = useCallback((filter: Filter) => {
    editingFilter.current = filter;
  }, []);

  // TODO handle cancel edit name
  const handleExitEditFilterName: EditableLabelProps["onExitEditMode"] =
    useCallback(
      (_, editedValue = "") => {
        if (editingFilter.current) {
          const indexOfEditedFilter = onRenameFilter(
            editingFilter.current,
            editedValue
          );
          editingFilter.current = undefined;
          focusFilterPill(indexOfEditedFilter);
        }
      },
      [focusFilterPill, onRenameFilter]
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
          editPillLabel(index);
          return true;
        }
        case "edit-filter": {
          const { filter } = options as FilterMenuOptions;
          editingFilter.current = filter;
          setEditFilter(filter);
          focusFilterClause();
          return true;
        }
        default:
          return false;
      }
    },
    [deleteFilter, editPillLabel, filters, focusFilterClause]
  );

  const addIfNewElseUpdate = useCallback(
    (edited: Filter, existing: Filter | undefined) => {
      if (existing === undefined) {
        const idx = onAddFilter(edited);
        editPillLabel(idx);
      } else {
        onChangeFilter(existing, edited);
      }
    },
    [editPillLabel, onAddFilter, onChangeFilter]
  );

  const handleMenuAction = useCallback<MenuActionHandler>(
    ({ menuId }) => {
      switch (menuId) {
        case "apply-save": {
          const editedFilter = editFilter as Filter;
          addIfNewElseUpdate(editedFilter, editingFilter.current);
          setEditFilter(undefined);
          editingFilter.current = undefined;
          setShowMenu(false);
          return true;
        }
        case "and-clause": {
          const newFilter = addClause(
            editFilter as Filter,
            EMPTY_FILTER_CLAUSE
          );
          setEditFilter(newFilter);
          setShowMenu(false);
          return true;
        }
        case "or-clause":
          setEditFilter((filter) =>
            addClause(filter as Filter, EMPTY_FILTER_CLAUSE, {
              combineWith: "or",
            })
          );
          setShowMenu(false);
          return true;
        default:
          return false;
      }
    },
    [editFilter, addIfNewElseUpdate]
  );

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (itemIndex) => {
      onChangeActiveFilterIndex(itemIndex);
      onChangeActiveFilterIndexProp?.(itemIndex);
    },
    [onChangeActiveFilterIndexProp, onChangeActiveFilterIndex]
  );

  const handleClickAddFilter = useCallback(() => {
    setEditFilter({});
  }, [setEditFilter]);

  const handleClickRemoveFilter = useCallback(() => {
    setEditFilter(undefined);
  }, []);

  const pillProps: Partial<FilterPillProps> = {
    onBeginEdit: handleBeginEditFilterName,
    onMenuAction: handlePillMenuAction,
    onExitEditMode: handleExitEditFilterName,
  };

  const handleChangeFilterClause = useCallback(
    (idx: number) => (filterClause: Partial<FilterClause>) => {
      if (filterClause !== undefined) {
        setEditFilter((ef) => replaceClause(ef, filterClause, idx));
        setShowMenu(true);
      }
    },
    []
  );

  const handleCancelFilterClause = useCallback<FilterClauseCancelHandler>(
    (reason) => {
      if (reason === "Backspace" && isMultiClauseFilter(editFilter)) {
        setEditFilter(removeLastClause(editFilter));
      }
    },
    [editFilter]
  );

  const handleBlurFilterClause = useCallback<FocusEventHandler>((e) => {
    const target = e.target as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    const filterClause = target.closest(".vuuFilterClause");
    if (filterClause?.contains(relatedTarget)) {
      // do nothing
    } else {
      const dropdownId = target.getAttribute("aria-owns");
      const dropDown = dropdownId ? document.getElementById(dropdownId) : null;
      if (dropDown?.contains(relatedTarget)) {
        // do nothing
      } else {
        // if clause is complete
        setShowMenu(true);
      }
    }
  }, []);

  const handleFocusFilterClause = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleKeyDownFilterbar = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === "Escape" && editFilter !== undefined) {
        // TODO confirm if edits applied ?
        setEditFilter(undefined);
        requestAnimationFrame(() => {
          // focus edited pill
        });
      }
    },
    [editFilter]
  );

  const handleKeyDownMenu = useCallback<KeyboardEventHandler>(
    (evt) => {
      const { current: container } = containerRef;
      if (evt.key === "Backspace" && container) {
        evt.preventDefault();
        const fields = Array.from(
          container.querySelectorAll(".vuuFilterClauseField")
        );
        if (fields.length > 0) {
          const field = fields.at(-1) as HTMLElement;
          field?.querySelector("input")?.focus();
        }
        setShowMenu(false);
      } else if (evt.key === "Tab") {
        if (evt.shiftKey && container) {
          const clearButtons = Array.from(
            container.querySelectorAll(".vuuFilterClause-clearButton")
          ) as HTMLButtonElement[];
          if (clearButtons.length > 0) {
            const clearButton = clearButtons.at(-1) as HTMLButtonElement;
            setTimeout(() => {
              clearButton.focus();
            }, 100);
          }
        } else {
          console.log("apply current selection");
        }
      }
    },
    [containerRef]
  );

  const handleAddButtonKeyDown = useCallback<KeyboardEventHandler>((evt) => {
    if (evt.key === "ArrowLeft") {
      console.log("navgiate to the Toolbar");
    }
  }, []);

  const handlePillNavigationOutOfBounds =
    useCallback<NavigationOutOfBoundsHandler>((direction) => {
      if (direction === "end") {
        addButtonRef.current?.focus();
      }
    }, []);

  const addButtonProps = {
    ref: addButtonRef,
    onKeyDown: handleAddButtonKeyDown,
  };

  return {
    activeFilterIndex,
    addButtonProps,
    columnsByName,
    editFilter,
    filters,
    onBlurFilterClause: handleBlurFilterClause,
    onCancelFilterClause: handleCancelFilterClause,
    onChangeActiveFilterIndex: handleChangeActiveFilterIndex,
    onClickAddFilter: handleClickAddFilter,
    onClickRemoveFilter: handleClickRemoveFilter,
    onChangeFilterClause: handleChangeFilterClause,
    onFocusFilterClause: handleFocusFilterClause,
    onKeyDownFilterbar: handleKeyDownFilterbar,
    onKeyDownMenu: handleKeyDownMenu,
    onMenuAction: handleMenuAction,
    onNavigateOutOfBounds: handlePillNavigationOutOfBounds,
    pillProps,
    promptProps,
    showMenu,
  };
};

function columnDescriptorsByName(
  columns: ColumnDescriptor[]
): ColumnDescriptorsByName {
  return columns.reduce((m, col) => ({ ...m, [col.name]: col }), {});
}
