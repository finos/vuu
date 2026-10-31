import {
  TreeDataSource,
  type TreeNodeFilterPredicate,
} from "@vuu-ui/vuu-data-local";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  type ChangeEvent,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface TreeNavPanelHookProps {
  filterPredicate?: TreeNodeFilterPredicate;
  searchPattern?: string;
  source: TreeSourceNode[];
  useDefaultFilter: boolean;
}

export const useTreeNavPanel = ({
  filterPredicate: filterPredicateProp,
  searchPattern: searchPatternProp,
  source,
  useDefaultFilter,
}: TreeNavPanelHookProps) => {
  const dataSource = useMemo(
    () => new TreeDataSource({ data: source }),
    [source],
  );
  const [defaultQuery, setDefaultQuery] = useState("");

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    setDefaultQuery(evt.target.value);
  }, []);

  const defaultPredicate = useMemo<TreeNodeFilterPredicate | undefined>(() => {
    const text = defaultQuery.trim().toLowerCase();
    return text === ""
      ? undefined
      : ({ label }) => label.toLowerCase().includes(text);
  }, [defaultQuery]);

  const filterPredicate = useDefaultFilter
    ? defaultPredicate
    : filterPredicateProp;

  useEffect(() => {
    dataSource.filterNodes(filterPredicate);
  }, [dataSource, filterPredicate]);

  const defaultFilter = useDefaultFilter
    ? createElement("input", {
        "aria-label": "Filter",
        className: "vuuTreeNavPanel-filterInput",
        onChange: handleChange,
        placeholder: "Filter",
        type: "search",
        value: defaultQuery,
      })
    : null;

  return {
    dataSource,
    defaultFilter,
    searchPattern: useDefaultFilter
      ? defaultQuery.trim()
      : (searchPatternProp ?? ""),
  };
};
