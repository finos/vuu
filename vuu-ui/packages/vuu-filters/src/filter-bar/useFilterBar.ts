import { MenuActionHandler } from "@finos/vuu-data-types";
import {
  Filter,
  FilterClause,
  FilterWithPartialClause,
} from "@finos/vuu-filter-types";
import { PromptProps } from "@finos/vuu-popups";
import { dispatchMouseEvent, filterAsQuery } from "@finos/vuu-utils";
import { EditableLabelProps } from "@salt-ds/lab";
import {
  ActiveItemChangeHandler,
  NavigationOutOfBoundsHandler,
} from "@finos/vuu-layout";
import {
  KeyboardEvent,
  KeyboardEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterPillProps } from "../filter-pill";
import { FilterMenuOptions } from "../filter-pill-menu";
import { addClause, replaceClause } from "../filter-utils";
import { FilterBarProps } from "./FilterBar";
import { useFilters } from "./useFilters";

export interface FilterBarHookProps
  extends Pick<
    FilterBarProps,
    | "activeFilterIndex"
    | "filters"
    | "onApplyFilter"
    | "onFiltersChanged"
    | "showMenu"
  > {
  containerRef: RefObject<HTMLDivElement>;
}

const EMPTY_FILTER_CLAUSE: Partial<Filter> = {};

export const useFilterBar = ({
  activeFilterIndex: activeFilterIdexProp = [],
  containerRef,
  filters: filtersProp,
  onApplyFilter,
  onFiltersChanged,
  showMenu: showMenuProp,
}: FilterBarHookProps) => {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const editingFilter = useRef<Filter | undefined>();
  const [activeFilterIndex, setActiveFilterIndex] =
    useState<number[]>(activeFilterIdexProp);
  const [showMenu, setShowMenu] = useState(showMenuProp);
  const [editFilter, setEditFilter] = useState<
    Partial<Filter> | FilterWithPartialClause | undefined
  >();
  const [promptProps, setPromptProps] = useState<PromptProps | null>(null);

  const {
    filters,
    onAddFilter,
    onChangeFilter,
    onDeleteFilter,
    onRenameFilter,
  } = useFilters({
    filters: filtersProp,
    onFiltersChanged,
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
    (index = 0) => {
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

  const applyFilter = useCallback(
    (filter?: Filter) => {
      const filterQuery = filter ? filterAsQuery(filter) : "";
      onApplyFilter({
        filter: filterQuery,
        filterStruct: filter,
      });
    },
    [onApplyFilter]
  );

  const deleteConfirmed = useCallback(
    (filter: Filter) => {
      const indexOfFilter = filters.indexOf(filter);
      if (activeFilterIndex.includes(indexOfFilter)) {
        // deselect filter
        setActiveFilterIndex(
          activeFilterIndex.filter((i) => i !== indexOfFilter)
        );
      }
      const indexOfDeletedFilter = onDeleteFilter?.(filter);
      if (activeFilterIndex.includes(indexOfDeletedFilter)) {
        setActiveFilterIndex((indices) =>
          indices.filter((i) => i !== indexOfDeletedFilter)
        );
      }

      // TODO move focus to next/previous filter
      requestAnimationFrame(() => {
        if (filters.length) {
          focusFilterPill(0);
        }
      });
    },
    [activeFilterIndex, filters, focusFilterPill, onDeleteFilter]
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

  const handleMenuAction = useCallback<MenuActionHandler>(
    ({ menuId }) => {
      switch (menuId) {
        case "apply-save": {
          // TODO save these into state together
          const isNewFilter = editingFilter.current === undefined;
          const newFilter = editFilter as Filter;
          const changeHandler = isNewFilter ? onAddFilter : onChangeFilter;
          const indexOfNewFilter = changeHandler(newFilter);

          if (isNewFilter) {
            editPillLabel(indexOfNewFilter);
          }

          setEditFilter(undefined);

          setActiveFilterIndex((indices) =>
            indices.includes(indexOfNewFilter)
              ? indices
              : indices.concat(indexOfNewFilter)
          );

          setShowMenu(false);
          return true;
        }

        case "and-clause":
          setEditFilter((filter) =>
            addClause(filter as Filter, EMPTY_FILTER_CLAUSE)
          );
          setShowMenu(false);
          return true;
        case "or-clause":
          setEditFilter((filter) =>
            addClause(filter as Filter, {}, { combineWith: "or" })
          );
          setShowMenu(false);
          return true;
        default:
          return false;
      }
    },
    [editFilter, editPillLabel, onAddFilter, onChangeFilter]
  );

  useEffect(() => {
    if (activeFilterIndex.length > 0) {
      const activeFilters = activeFilterIndex.map<Filter>(
        (index) => filters[index]
      );
      if (activeFilters.length === 1) {
        const [filter] = activeFilters;
        applyFilter(filter);
      } else {
        applyFilter({
          op: "and",
          filters: activeFilters,
        });
      }
    } else {
      applyFilter();
    }
  }, [activeFilterIndex, applyFilter, filters]);

  const handleChangeActiveFilterIndex = useCallback<ActiveItemChangeHandler>(
    (itemIndex) => {
      setActiveFilterIndex(itemIndex);
    },
    []
  );

  const handleClickAddFilter = useCallback(() => {
    setEditFilter({});
  }, []);

  const handleClickRemoveFilter = useCallback(() => {
    setEditFilter(undefined);
  }, []);

  const pillProps: Partial<FilterPillProps> = {
    onBeginEdit: handleBeginEditFilterName,
    onMenuAction: handlePillMenuAction,
    onExitEditMode: handleExitEditFilterName,
  };

  const handleChangeFilterClause = (filterClause: Partial<FilterClause>) => {
    console.log({ filterClause });
    if (filterClause !== undefined) {
      setEditFilter((filter) => replaceClause(filter, filterClause));
      setShowMenu(true);
    }
  };

  const onKeyDown = useCallback(
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
    editFilter,
    filters,
    onChangeActiveFilterIndex: handleChangeActiveFilterIndex,
    onClickAddFilter: handleClickAddFilter,
    onClickRemoveFilter: handleClickRemoveFilter,
    onChangeFilterClause: handleChangeFilterClause,
    onKeyDown,
    onMenuAction: handleMenuAction,
    onNavigateOutOfBounds: handlePillNavigationOutOfBounds,
    pillProps,
    promptProps,
    showMenu,
  };
};
