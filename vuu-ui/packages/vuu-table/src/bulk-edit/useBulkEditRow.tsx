import {
  buildValidationChecker,
  getEditValidationRules,
} from "@vuu-ui/vuu-data-react";
import { DataValueDescriptor, EditPhase } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { CommitHandler, getTypedValue, queryClosest } from "@vuu-ui/vuu-utils";
import { InputProps } from "@salt-ds/core";
import {
  FocusEventHandler,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEditableCell } from "../useEditableCell";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: VuuRowDataItemType,
) => void;

export interface EditableBulkHookProps {
  descriptors: DataValueDescriptor[];
  onBulkChange: EditValueChangeHandler;
  onRowChange: (isValid: boolean) => void;
}
type ValidationState = {
  ok: boolean;
  messages: Record<string, string>;
};

const getValidationChecker = (
  descriptor: DataValueDescriptor,
  editPhase: EditPhase | "*",
) => {
  const rules = getEditValidationRules(descriptor, editPhase);
  return buildValidationChecker(rules);
};

const nextValidationState = (
  state: ValidationState,
  dataDescriptor: DataValueDescriptor,
  value: VuuRowDataItemType,
): ValidationState => {
  const check = getValidationChecker(dataDescriptor, "change");
  const result = check(value, "change");
  const { name } = dataDescriptor;

  const { ok: wasOk, messages: existingMessages } = state;

  if (result.ok) {
    if (!wasOk) {
      // if this field was the only one in error, the overall state
      // will now be ok, but not if there is still one or more other
      // field still in error.
      const fieldsInError = Object.keys(existingMessages);
      if (fieldsInError.includes(name)) {
        if (fieldsInError.length === 1) {
          return { ok: true, messages: {} };
        } else {
          const messages = { ...existingMessages };
          delete messages[name];
          return { ok: false, messages };
        }
      }
    }
  } else {
    return {
      ok: false,
      messages: {
        ...existingMessages,
        [name]: result.messages.join("\n"),
      },
    };
  }

  return state;
};

function find(descriptors: DataValueDescriptor[], fieldname: string) {
  const d = descriptors.find(({ name }) => name === fieldname);
  if (d) {
    return d;
  }
  throw Error(`DataValueDescriptor not found for field ${fieldname}`);
}

const getField = (target: EventTarget | HTMLElement) => {
  const fieldElement = queryClosest(target, "[data-field]");
  if (fieldElement) {
    return fieldElement.dataset.field as string;
  } else {
    throw Error("no field ");
  }
};

export const useBulkEditRow = ({
  descriptors,
  onBulkChange,
  onRowChange,
}: EditableBulkHookProps) => {
  const formFieldsContainerRef = useRef<HTMLDivElement>(null);
  const focusedFieldRef = useRef("");
  const [, forceUpdate] = useState({});
  const validationStateRef = useRef<ValidationState>({
    ok: true,
    messages: {},
  });

  const bulkRowValidationState = useCallback(
    (state: ValidationState) => {
      validationStateRef.current = state;
      onRowChange(state.ok);
      forceUpdate({});
    },
    [onRowChange],
  );

  const handleFocus = useCallback<FocusEventHandler>((evt) => {
    // Ignore focus on popup Calendars, Lists etc
    if (formFieldsContainerRef.current?.contains(evt.target)) {
      const fieldName = getField(evt.target);
      if (fieldName) {
        if (fieldName) {
          focusedFieldRef.current = fieldName;
        }
      }
    }
  }, []);

  const handleChange = useCallback(
    (evt: SyntheticEvent<HTMLInputElement>) => {
      const { current: fieldName } = focusedFieldRef;
      if (fieldName) {
        const input = queryClosest<HTMLInputElement>(evt.target, "input", true);
        const dataDescriptor = find(descriptors, fieldName);
        const value = input.value as string;
        const { current: state } = validationStateRef;
        const newState = nextValidationState(state, dataDescriptor, value);
        if (newState !== state) {
          bulkRowValidationState(newState);
        }
      }
    },
    [descriptors, bulkRowValidationState],
  );

  const {
    current: { messages: errorMessages },
  } = validationStateRef;

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (evt, value) => {
      if (typeof value === "string" && value.trim() !== "") {
        const columnName = focusedFieldRef.current;
        if (columnName) {
          const column = descriptors.find((c) => c.name === columnName);
          if (column && errorMessages[columnName] === undefined) {
            const { serverDataType = "string" } = column;
            const typedValue = getTypedValue(value, serverDataType, true);
            onBulkChange(column, typedValue);
          }
        }
      }
    },
    [descriptors, errorMessages, onBulkChange],
  );

  const InputProps = useMemo<Partial<InputProps>>(
    () => ({
      inputProps: {
        placeholder: "Enter value",
      },
      onChange: handleChange,
      variant: "primary",
    }),
    [handleChange],
  );

  const { onKeyDown } = useEditableCell();

  return {
    errorMessages,
    formFieldsContainerRef,
    InputProps,
    onCommit: handleCommit,
    onFocus: handleFocus,
    onKeyDown,
  };
};
