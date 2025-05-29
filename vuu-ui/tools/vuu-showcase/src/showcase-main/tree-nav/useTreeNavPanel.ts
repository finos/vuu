import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { TreeNavPanelProps } from "./TreeNavPanel";
import { TreeDataSource } from "@vuu-ui/vuu-data-local";

export type TreeNavPanelHookProps = Pick<TreeNavPanelProps, "source">;

export const useTreeNavPanel = ({ source }: TreeNavPanelHookProps) => {
  const dataSource = useMemo(
    () => new TreeDataSource({ data: source }),
    [source],
  );
  const [searchPattern, setSearchPattern] = useState<string>("");

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      const value = evt.target.value.trim();
      setSearchPattern(value);

      if (value === "") {
        dataSource.filter = { filter: "" };
      } else {
        dataSource.filter = { filter: `label contains "${value}"` };
      }
    },
    [dataSource],
  );

  return {
    dataSource,
    onChange: handleChange,
    searchPattern,
  };
};
