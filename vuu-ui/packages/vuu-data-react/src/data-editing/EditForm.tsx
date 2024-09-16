import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataValueDescriptor, EditValidationRule } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { Entity, isTypeDescriptor, queryClosest } from "@finos/vuu-utils";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, SyntheticEvent, useCallback, useState } from "react";
import { registerRules } from "./edit-validation-rules";
import { buildValidationChecker } from "@finos/vuu-ui-controls";

import "./EditForm.css";

const classBase = "EditForm";

registerRules();

const anyErrors = (validationState: Record<string, any>) =>
  Object.values(validationState).some(
    (item) => item === false || typeof item === "string",
  );

function find(descriptors: DataValueDescriptor[], fieldname: string) {
  const d = descriptors.find(({ name }) => name === fieldname);
  if (d) {
    return d;
  }
  throw Error(`DataValueDescriptor not found for field ${fieldname}`);
}

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

export interface EditFormProps<T extends Entity>
  extends HTMLAttributes<HTMLDivElement> {
  editEntity?: T;
  formFieldDescriptors: DataValueDescriptor[];
  onChangeFormField: (evt: SyntheticEvent) => void;
  onCommitFieldValue: (fieldName: string, value: VuuRowDataItemType) => void;
  onSubmit: () => void;
}

const getField = (target: EventTarget | HTMLElement) => {
  const fieldElement = queryClosest(target, "[data-field]");
  if (fieldElement) {
    return fieldElement.dataset.field as string;
  } else {
    throw Error("no field ");
  }
};

export const EditForm = <T extends Entity = Entity>({
  className,
  editEntity,
  formFieldDescriptors,
  onChangeFormField,
  onCommitFieldValue,
  onSubmit,
  ...htmlAttributes
}: EditFormProps<T>) => {
  const [validationState, setValidationState] = useState<Record<string, any>>(
    {},
  );

  const commitHandler = useCallback(
    (evt, value) => {
      const fieldName = getField(evt.target);
      const dataDescriptor = find(formFieldDescriptors, fieldName);
      const check = getValidationChecker(dataDescriptor, "commit");

      const result = check(value);

      console.log(`commit, rules applied to ${value} (${fieldName}) ${result}`);

      if (result === false || typeof result === "string") {
        console.log("no commit, rules broken");
        setValidationState((state) => ({ ...state, [fieldName]: result }));
      } else {
        onCommitFieldValue(fieldName, value);
      }
    },
    [formFieldDescriptors, onCommitFieldValue],
  );

  const handleChange = useCallback(
    (evt: SyntheticEvent<HTMLInputElement>) => {
      const input = queryClosest<HTMLInputElement>(evt.target, "input", true);
      const fieldName = getField(evt.target);
      const dataDescriptor = find(formFieldDescriptors, fieldName);
      const value = input.value as string;
      const check = getValidationChecker(dataDescriptor, "change");
      const result = check(value);

      if (result === false || typeof result === "string") {
        setValidationState((state) => ({ ...state, [fieldName]: result }));
      } else {
        if (
          validationState[fieldName] === false ||
          typeof validationState[fieldName] === "string"
        ) {
          setValidationState((state) => ({ ...state, [fieldName]: true }));
        }
        console.log(
          `change, rules applied to ${value} (${fieldName}) ${result}`,
        );
      }
      onChangeFormField(evt);
    },
    [formFieldDescriptors, onChangeFormField, validationState],
  );

  const handleSubmit = useCallback(() => {
    if (anyErrors(validationState)) {
      console.log("no subbmit while we have errors");
    } else {
      onSubmit();
    }
  }, [onSubmit, validationState]);

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {formFieldDescriptors.map((dataDescriptor) => {
        const { name, label = name } = dataDescriptor;
        const validationStatus = validationState[name];
        console.log(`validationSTat ${validationStatus}`);

        const errorMessage =
          typeof validationStatus === "string" ? validationStatus : undefined;

        return (
          <FormField data-field={name} key={name}>
            <FormFieldLabel>{label}</FormFieldLabel>
            {getDataItemEditControl({
              InputProps: {
                onChange: handleChange,
                value: editEntity?.[name]?.toString() ?? "",
              },
              dataDescriptor,
              errorMessage,
              onCommit: commitHandler,
            })}
          </FormField>
        );
      })}

      <div className={`${classBase}-buttons`}>
        <Button onClick={handleSubmit}>Save</Button>
      </div>
    </div>
  );
};
