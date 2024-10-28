import { DataSource } from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@finos/vuu-table-types";
import { ColumnMap, buildColumnMap, queryClosest } from "@finos/vuu-utils";
import { MutableRefObject, SyntheticEvent, useCallback, useRef } from "react";

export interface EditBulkPanelProps {
  columnDescriptors: ColumnDescriptor[];
  dataSource: DataSource;
  bulkRowValidRef: MutableRefObject<boolean>;
  handleChange: (val: boolean) => void;
}

function find(descriptors: ColumnDescriptor[], fieldname: string) {
  const d = descriptors.find(({ name }) => name === fieldname);
  if (d) {
    return d;
  }
  throw Error(`DataValueDescriptor not found for field ${fieldname}`);
}

const isRecorded = (index: string[], record: string[][]) => {
  for (const r of record) {
    if (isSameArray(r, index)) {
      return true;
    }
  }
  return false;
};

const isSameArray = (arr1: string[], arr2: string[]) => {
  return arr1[0] === arr2[0] && arr1[1] === arr2[1];
};

export const useBulkEditPanel = ({
  columnDescriptors,
  dataSource,
  bulkRowValidRef,
  handleChange,
}: EditBulkPanelProps) => {
  const fieldContainerRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef<string[]>();
  const errorsRef = useRef<string[][]>([]);

  const columnMap = buildColumnMap(dataSource.columns);
  const getFieldFromIndex = (columnMap: ColumnMap, idx: number) => {
    for (const [fieldName, index] of Object.entries(columnMap)) {
      if (index === idx + 7) {
        return fieldName;
      }
    }
    throw Error(`Field name not found for col-index ${idx}`);
  };

  const handleFocus = useCallback((evt) => {
    const rowIndex = queryClosest(evt.target, "[aria-rowindex]")?.ariaRowIndex;
    const colIndex = queryClosest(evt.target, "[aria-colindex]")?.ariaColIndex;
    if (rowIndex && colIndex) {
      focusIndexRef.current = [rowIndex, colIndex];
    }
  }, []);

  const handleFieldChange = useCallback(
    (evt: SyntheticEvent<HTMLInputElement>) => {
      const value = (
        queryClosest(evt.target, "[value]") as unknown as HTMLInputElement
      ).value;
      if (focusIndexRef.current) {
        const fieldName = getFieldFromIndex(
          columnMap,
          parseInt(focusIndexRef.current[1]),
        );
        const d = find(columnDescriptors, fieldName);
        if ((d as RuntimeColumnDescriptor).clientSideEditValidationCheck) {
          const check = (d as RuntimeColumnDescriptor)
            .clientSideEditValidationCheck;
          if (check) {
            const result = check(value);
            if (
              !result.ok &&
              !isRecorded(focusIndexRef.current, errorsRef.current)
            ) {
              console.log("add to errors: ", result);
              errorsRef.current.push(focusIndexRef.current);
            } else if (
              result.ok &&
              isRecorded(focusIndexRef.current, errorsRef.current)
            ) {
              const newRef = [];
              for (const error of errorsRef.current) {
                if (!isSameArray(error, focusIndexRef.current)) {
                  newRef.push(error);
                }
              }
              errorsRef.current = newRef;
            }
          }
        }
      }

      if (bulkRowValidRef) {
        if (
          bulkRowValidRef.current === true &&
          errorsRef.current.length === 0
        ) {
          handleChange(true);
          console.log("can submit", errorsRef.current);
        } else {
          handleChange(false);
          console.log("cannot submit", errorsRef.current);
        }
      }
    },
    [],
  );

  return {
    fieldContainerRef,
    onChange: handleFieldChange,
    onFocus: handleFocus,
  };
};
