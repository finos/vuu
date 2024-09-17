import { getDataItemEditControl } from "@finos/vuu-data-react";
import { DataValueDescriptor } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { Entity } from "@finos/vuu-utils";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, SyntheticEvent } from "react";
import { registerRules } from "./edit-validation-rules";
import { useEditForm } from "./useEditForm";

import editFormCss from "./EditForm.css";

const classBase = "EditForm";

registerRules();

export interface EditFormProps<T extends Entity>
  extends HTMLAttributes<HTMLDivElement> {
  editEntity?: T;
  formFieldDescriptors: DataValueDescriptor[];
  onChangeFormField: (evt: SyntheticEvent) => void;
  onCommitFieldValue: (fieldName: string, value: VuuRowDataItemType) => void;
  onSubmit: () => void;
}

export const EditForm = <T extends Entity = Entity>({
  className,
  editEntity,
  formFieldDescriptors,
  onChangeFormField,
  onCommitFieldValue,
  onSubmit,
  ...htmlAttributes
}: EditFormProps<T>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-edit-form",
    css: editFormCss,
    window: targetWindow,
  });

  const { errorMessages, ok, onChange, onCommit } = useEditForm({
    formFieldDescriptors,
    onChangeFormField,
    onCommitFieldValue,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {formFieldDescriptors.map((dataDescriptor) => {
        const { name, label = name } = dataDescriptor;
        const errorMessage = errorMessages[name];

        return (
          <FormField data-field={name} key={name}>
            <FormFieldLabel>{label}</FormFieldLabel>
            {getDataItemEditControl({
              InputProps: {
                onChange,
                value: editEntity?.[name]?.toString() ?? "",
              },
              dataDescriptor,
              errorMessage,
              onCommit,
            })}
          </FormField>
        );
      })}

      <div className={`${classBase}-buttons`}>
        <Button>Cancel</Button>
        <Button onClick={onSubmit} disabled={!ok}>
          Save
        </Button>
      </div>
    </div>
  );
};
