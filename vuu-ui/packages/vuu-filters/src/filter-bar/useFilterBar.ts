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
  KeyboardEvent,
  RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { FilterPillProps } from "../filter-pill";
import { FilterMenuOptions } from "../filter-pill-menu";
import { addClause, replaceClause } from "../filter-utils";
import { FilterBarProps } from "./FilterBar";

export interface FilterBarHookProps
  extends Pick<
    FilterBarProps,
    | "filters"
    | "onActiveChange"
    | "onApplyFilter"
    | "onAddFilter"
    | "onDeleteFilter"
    | "onRemoveFilter"
    | "onRenameFilter"
    | "onChangeFilter"
    | "showMenu"
  > {
  containerRef: RefObject<HTMLDivElement>;
}

const EMPTY_FILTER_CLAUSE: Partial<Filter> = {};

export const useFilterBar = ({
  containerRef,
  filters: filtersProp,
  onActiveChange,
  onApplyFilter,
  onAddFilter,
  onDeleteFilter,
  onRemoveFilter,
  onRenameFilter,
  onChangeFilter,
  showMenu: showMenuProp,
}: FilterBarHookProps) => {
  const editingFilter = useRef<Filter | undefined>();
  const [activeFilterIndices, setActiveFilterIndices] = useState<number[]>([]);
  const [showMenu, setShowMenu] = useState(showMenuProp);
  const [filters, setFilters] = useState<Filter[]>(filtersProp);
  const [editFilter, setEditFilter] = useState<
    Partial<Filter> | FilterWithPartialClause | undefined
  >();
  const [promptProps, setPromptProps] = useState<PromptProps | null>(null);

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

  const deleteConfirmed = useCallback(
    (filter: Filter) => {
      const indexOfFilter = filters.indexOf(filter);
      if (activeFilterIndices.includes(indexOfFilter)) {
        // deselect filter
        setActiveFilterIndices(
          activeFilterIndices.filter((i) => i !== indexOfFilter)
        );
      }
      setFilters((filters) => filters.filter((f) => f !== filter));
      onDeleteFilter?.(filter);

      // TODO move focus to next/previous filter
      requestAnimationFrame(() => {
        if (filters.length) {
          focusFilterPill(0);
        }
      });
    },
    [activeFilterIndices, filters, focusFilterPill, onDeleteFilter]
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

  const saveFilter = useCallback(
    (filter: Filter) => {
      let index = -1;
      setFilters((filters) => {
        const newFilters = filters.map((f, i) => {
          if (f === filter) {
            index = i;
            return filter;
          } else {
            return f;
          }
        });
        return newFilters;
      });
      onChangeFilter?.(filter);
      return index;
    },
    [onChangeFilter]
  );

  const renameFilter = useCallback(
    (filter: Filter, name: string) => {
      let index = -1;
      setFilters((filters) => {
        const newFilters = filters.map((f, i) => {
          if (f === filter) {
            index = i;
            return { ...f, name };
          } else {
            return f;
          }
        });
        return newFilters;
      });
      onRenameFilter?.(filter, name);
      return index;
    },
    [onRenameFilter]
  );

  const saveNewFilter = useCallback(
    (filter: Filter) => {
      let index = -1;
      setFilters((filters) => {
        index = filters.length;
        const newFilters = filters.concat(filter);
        editPillLabel(index);
        return newFilters;
      });
      onAddFilter?.(filter);
      return index;
    },
    [editPillLabel, onAddFilter]
  );

  const handleBeginEditFilterName = useCallback((filter: Filter) => {
    editingFilter.current = filter;
  }, []);

  // TODO handle cancel edit name
  const handleExitEditFilterName: EditableLabelProps["onExitEditMode"] =
    useCallback(
      (_, editedValue = "") => {
        if (editingFilter.current) {
          const indexOfEditedFilter = renameFilter(
            editingFilter.current,
            editedValue
          );
          editingFilter.current = undefined;
          focusFilterPill(indexOfEditedFilter);
        }
      },
      [focusFilterPill, renameFilter]
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
          const { current: editedFilter } = editingFilter;

          const newFilter = editFilter as Filter;
          const save = editedFilter ? saveFilter : saveNewFilter;
          const indexOfNewFilter = save(newFilter);

          setEditFilter(undefined);

          if (!activeFilterIndices.includes(indexOfNewFilter)) {
            setActiveFilterIndices((indices) =>
              indices.concat(indexOfNewFilter)
            );
          }
          setShowMenu(false);
          applyFilter(newFilter);
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
    [activeFilterIndices, applyFilter, editFilter, saveFilter, saveNewFilter]
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

  const handleFilterActivation = useCallback(
    (activeIndices: number[]) => {
      if (activeIndices.length > 0) {
        const activeFilters = activeIndices.map<Filter>(
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
      setActiveFilterIndices(activeIndices);
      onActiveChange?.(activeIndices);
    },
    [applyFilter, filters, onActiveChange]
  );

  return {
    activeFilterIndices,
    editFilter,
    filters,
    onClickAddFilter: handleClickAddFilter,
    onClickRemoveFilter: handleClickRemoveFilter,
    onChangeFilterClause: handleChangeFilterClause,
    onFilterActivation: handleFilterActivation,
    onKeyDown,
    onMenuAction: handleMenuAction,
    pillProps,
    promptProps,
    showMenu,
  };
};
