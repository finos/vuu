import { Entity, isTypeDescriptor, queryClosest } from "@finos/vuu-utils";
import { EditFormProps } from "./EditForm";
import { SyntheticEvent, useCallback, useRef, useState } from "react";
import { DataValueDescriptor, EditValidationRule } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { buildValidationChecker } from "./edit-rule-validation-checker";

export type EditFormHookProps<T extends Entity> = Pick<
  EditFormProps<T>,
  | "editEntity"
  | "formFieldDescriptors"
  | "onChangeFormField"
  | "onCommitFieldValue"
>;

type ValidationState = {
  ok: boolean;
  messages: Record<string, string>;
};

type FormEditState = {
  isDirty: boolean;
  editedFields: string[];
};

const NO_VALIDATION_RULES: EditValidationRule[] = [] as const;

function getEditValidationRules(
  descriptor: DataValueDescriptor,
  apply: "change" | "commit",
) {
  if (isTypeDescriptor(descriptor.type)) {
    return (
      descriptor.type.rules?.filter(({ apply: a = "commit" }) => a === apply) ??
      NO_VALIDATION_RULES
    );
  }

  return NO_VALIDATION_RULES;
}

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

export const useEditForm = <T extends Entity>({
  editEntity,
  formFieldDescriptors,
  onChangeFormField,
  onCommitFieldValue,
}: EditFormHookProps<T>) => {
  const validationStateRef = useRef<ValidationState>({
    ok: true,
    messages: {},
  });

  const [, forceUpdate] = useState({});

  const setValidationState = useCallback((state: ValidationState) => {
    console.log(`set new state ${JSON.stringify(state, null, 2)}`);
    validationStateRef.current = state;
    forceUpdate({});
  }, []);

  const commitHandler = useCallback(
    (evt, value) => {
      const fieldName = getField(evt.target);
      const dataDescriptor = find(formFieldDescriptors, fieldName);

      const { current: state } = validationStateRef;
      const newState = nextValidationState(state, dataDescriptor, value);
      if (newState !== state) {
        setValidationState(newState);
      }

      if (newState.ok) {
        onCommitFieldValue(fieldName, value);
      }
    },
    [formFieldDescriptors, onCommitFieldValue, setValidationState],
  );

  const handleChange = useCallback(
    (evt: SyntheticEvent<HTMLInputElement>) => {
      const input = queryClosest<HTMLInputElement>(evt.target, "input", true);
      const fieldName = getField(evt.target);
      const dataDescriptor = find(formFieldDescriptors, fieldName);
      const value = input.value as string;

      const { current: state } = validationStateRef;
      const newState = nextValidationState(state, dataDescriptor, value);
      if (newState !== state) {
        setValidationState(newState);
      }

      onChangeFormField(evt);
    },
    [formFieldDescriptors, onChangeFormField, setValidationState],
  );

  const {
    current: { ok, messages: errorMessages },
  } = validationStateRef;

  return {
    errorMessages,
    ok,
    onChange: handleChange,
    onCommit: commitHandler,
  };
};
