import { DataSource } from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  DataCellEditNotification,
  RuntimeColumnDescriptor,
} from "@finos/vuu-table-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { useCallback, useRef } from "react";

export interface EditBulkPanelProps {
  columnDescriptors: ColumnDescriptor[];
  dataSource: DataSource;
  onChange: (val: boolean) => void;
  rowState: boolean;
}

function find(descriptors: ColumnDescriptor[], fieldname: string) {
  const d = descriptors.find(({ name }) => name === fieldname);
  if (d) {
    return d;
  }
  throw Error(`DataValueDescriptor not found for field ${fieldname}`);
}

const isRecorded = (index: number[], record: number[][]) => {
  for (const r of record) {
    if (isSameArray(r, index)) {
      return true;
    }
  }
  return false;
};

const isSameArray = (arr1: number[], arr2: number[]) => {
  return arr1[0] == arr2[0] && arr1[1] == arr2[1];
};

export const useBulkEditPanel = ({
  columnDescriptors,
  dataSource,
  onChange,
  rowState,
}: EditBulkPanelProps) => {
  const errorsRef = useRef<number[][]>([]);

  const columnMap = buildColumnMap(dataSource.columns);

  const handleDataEdited = useCallback<DataCellEditNotification>(
    ({
      editType = "commit",
      isValid = true,
      row,
      columnName,
      value,
      previousValue = value,
    }) => {
      console.log(
        `data edited [${row[0]}], ${columnName} ${previousValue} => ${value} (${editType}) isValid ${isValid}`,
      );

      const d = find(columnDescriptors, columnName);
      if ((d as RuntimeColumnDescriptor).clientSideEditValidationCheck) {
        const check = (d as RuntimeColumnDescriptor)
          .clientSideEditValidationCheck;
        if (check) {
          const result = check(value.toString(), "change");
          console.log("result: ", value, result);
          if (
            !result.ok &&
            !isRecorded([row[0], columnMap[columnName]], errorsRef.current)
          ) {
            console.log("add to errors: ", result);
            errorsRef.current.push([row[0], columnMap[columnName]]);
          } else if (
            result.ok &&
            isRecorded([row[0], columnMap[columnName]], errorsRef.current)
          ) {
            const newRef = [];
            for (const error of errorsRef.current) {
              if (!isSameArray(error, [row[0], columnMap[columnName]])) {
                newRef.push(error);
              }
            }
            errorsRef.current = newRef;
          }
        }
      }
      console.log("errors: ", errorsRef.current);
      if (rowState === true && errorsRef.current.length === 0) {
        onChange(true);
      } else {
        onChange(false);
      }
    },
    [columnDescriptors, columnMap, onChange, rowState],
  );

  if (rowState === true && errorsRef.current.length === 0) {
    onChange(true);
  } else {
    onChange(false);
  }

  return {
    onDataEdited: handleDataEdited,
  };
};
