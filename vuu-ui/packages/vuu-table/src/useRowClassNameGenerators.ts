import { TableConfig } from "@vuu-ui/vuu-table-types";
import {
  getRowClassNameGenerator,
  RowClassNameGenerator,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const createClassNameGenerator = (
  ids?: string[],
): RowClassNameGenerator | undefined => {
  const functions: RowClassNameGenerator[] = [];
  ids?.forEach((id) => {
    const fn = getRowClassNameGenerator(id);
    if (fn) {
      functions.push(fn.fn);
    }
  });
  if (functions.length === 0) {
    return undefined;
  }
  return (dataRow, previousDataRow, nextDataRow) => {
    const classNames: string[] = [];
    functions.forEach((fn) => {
      const className = fn(dataRow, previousDataRow, nextDataRow);
      if (className) {
        classNames.push(className);
      }
    });
    return classNames.join(" ");
  };
};

export const useRowClassNameGenerators = ({
  rowClassNameGenerators,
}: TableConfig) => {
  return useMemo<RowClassNameGenerator | undefined>(() => {
    return createClassNameGenerator(rowClassNameGenerators);
  }, [rowClassNameGenerators]);
};
