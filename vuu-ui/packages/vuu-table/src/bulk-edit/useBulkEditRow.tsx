import {
  buildValidationChecker,
  getEditValidationRules,
} from "@finos/vuu-data-react";
import { DataValueDescriptor } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CommitHandler, queryClosest } from "@finos/vuu-utils";
import {
  FocusEventHandler,
  MutableRefObject,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";

export type EditValueChangeHandler = (
  column: ColumnDescriptor,
  value: string,
) => void;

export interface EditableBulkHookProps {
  descriptors: DataValueDescriptor[];
  onBulkChange: EditValueChangeHandler;
  bulkRowValidRef: MutableRefObject<boolean>;
}
type ValidationState = {
  ok: boolean;
  messages: Record<string, string>;
};

const getValidationChecker = (
  descriptor: DataValueDescriptor,
  apply: "change" | "commit",
) => {
  const rules = getEditValidationRules(descriptor, apply);
  return buildValidationChecker(rules);
};

const nextValidationState = (
  state: ValidationState,
  dataDescriptor: DataValueDescriptor,
  value: VuuRowDataItemType,
): ValidationState => {
  const check = getValidationChecker(dataDescriptor, "change");
  const result = check(value);
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
  bulkRowValidRef,
}: EditableBulkHookProps) => {
  const formFieldsContainerRef = useRef<HTMLDivElement>(null);
  const focusedFieldRef = useRef("");
  const [, forceUpdate] = useState({});
  const validationStateRef = useRef<ValidationState>({
    ok: true,
    messages: {},
  });

  const bulkRowValidRefationState = useCallback((state: ValidationState) => {
    validationStateRef.current = state;
    if (bulkRowValidRef) {
      bulkRowValidRef.current = state.ok;
    }
    forceUpdate({});
  }, []);

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
          bulkRowValidRefationState(newState);
        }
      }
    },
    [descriptors, bulkRowValidRefationState],
  );

  const {
    current: { ok, messages: errorMessages },
  } = validationStateRef;

  const onCommit = useCallback<CommitHandler<HTMLElement, string | undefined>>(
    (evt, value) => {
      if (value !== undefined && String(value).trim() !== "") {
        const columnName = focusedFieldRef.current;
        if (columnName) {
          const column = descriptors.find((c) => c.name === columnName);
          if (column && errorMessages[columnName] === undefined) {
            onBulkChange(column, value);
          }
        }
      }
    },
    [descriptors, errorMessages, onBulkChange],
  );

  return {
    errorMessages,
    formFieldsContainerRef,
    onChange: handleChange,
    onCommit,
    onFocus: handleFocus,
  };
};
