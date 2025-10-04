import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSavedFilters } from "../filter-provider/FilterContext";
import { CommitHandler, ValueOf } from "@vuu-ui/vuu-utils";
import { findMatchingFilter } from "../filter-utils";

export interface FilterNamePromptHookProps {
  filterName?: string;
  onConfirm: (filterName: string) => void;
}

const isValidName = (name: unknown): name is string =>
  typeof name === "string" && name.trim().length > 0;

const isDuplicateName = (names: string[], value: string) =>
  names.includes(value.toLowerCase());

export const Status = {
  Empty: "empty",
  Valid: "valid",
  Invalid: "invalid",
  DuplicateName: "duplicate-name",
} as const;
type Status = ValueOf<typeof Status>;

export const useFilterNamePrompt = ({
  filterName = "",
  onConfirm,
}: FilterNamePromptHookProps) => {
  const { currentFilter, savedFilters = [] } = useSavedFilters();
  const filterNameRef = useRef(filterName);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState<Status>(
    filterName !== "" ? Status.Valid : Status.Empty,
  );

  const nameOfDuplicateFilter = useMemo(() => {
    if (currentFilter.filter) {
      const matchingFilter = findMatchingFilter(
        savedFilters,
        currentFilter.filter,
      );
      if (matchingFilter) {
        return matchingFilter.filter?.name;
      }
    }
  }, [currentFilter.filter, savedFilters]);

  const existingFilterNames = useMemo(
    () =>
      savedFilters.reduce<string[]>((list, f) => {
        if (f.filter?.name) {
          list.push(f.filter.name.toLowerCase());
        }
        return list;
      }, []),
    [savedFilters],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(filterNameRef.current);
  }, [onConfirm]);

  const handleCommit = useCallback<CommitHandler>(
    (e, value) => {
      onConfirm(value as string);
    },
    [onConfirm],
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const value = e.target.value.trim();
      filterNameRef.current = value;

      setStatus((currentStatus) => {
        let newStatus = currentStatus;
        if (value === "") {
          newStatus = Status.Empty;
        } else {
          const isValid = isValidName(value);
          if (!isValid) {
            newStatus = Status.Invalid;
          } else if (isDuplicateName(existingFilterNames, value)) {
            newStatus = Status.DuplicateName;
          } else {
            newStatus = Status.Valid;
          }
        }
        return newStatus;
      });
    },
    [existingFilterNames],
  );

  const confirmButtonProps = useMemo(
    () => ({
      disabled: status !== Status.Valid && status !== Status.DuplicateName,
      label: status === Status.DuplicateName ? "replace filter" : "save filter",
      ref: confirmRef,
    }),
    [status],
  );

  return {
    confirmButtonProps,
    nameOfDuplicateFilter,
    onChange: handleChange,
    onCommit: handleCommit,
    onConfirm: handleConfirm,
    status,
    value: filterNameRef.current,
  };
};
