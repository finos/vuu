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
  return (row, columnMap) => {
    const classNames: string[] = [];
    functions?.forEach((fn) => {
      const className = fn(row, columnMap);
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
