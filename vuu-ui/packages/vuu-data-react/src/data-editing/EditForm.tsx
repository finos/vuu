import { getDataItemEditControl } from "@vuu-ui/vuu-data-react";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { registerRules } from "./edit-validation-rules";
import { EditFormHookProps, useEditForm } from "./useEditForm";

import editFormCss from "./EditForm.css";

const classBase = "EditForm";

registerRules();

export interface EditFormProps
  extends EditFormHookProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {}

export const EditForm = ({
  className,
  dataSource,
  formFieldDescriptors,
  onSubmit: onSubmitProp,
  ...htmlAttributes
}: EditFormProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-edit-form",
    css: editFormCss,
    window: targetWindow,
  });

  const {
    editedFields,
    editEntity,
    errorMessages,
    formFieldsContainerRef,
    isClean,
    ok,
    onCancel,
    onChange,
    onCommit,
    onFocus,
    onSubmit,
  } = useEditForm({
    dataSource,
    formFieldDescriptors,
    onSubmit: onSubmitProp,
  });

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      onFocus={onFocus}
    >
      <div className={`${classBase}-form-fields`} ref={formFieldsContainerRef}>
        {formFieldDescriptors.map((dataDescriptor) => {
          const { name, label = name } = dataDescriptor;
          const errorMessage = errorMessages[name];
          const isEdited = !isClean && editedFields.includes(name);

          return (
            <div
              className={`${classBase}-field`}
              key={name}
              data-edited={isEdited}
            >
              <FormField data-field={name}>
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
              <div className={`${classBase}-edit-indicator`} />
            </div>
          );
        })}
      </div>
      <div className={`${classBase}-buttons`}>
        <Button disabled={isClean} onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!ok || isClean}>
          Save
        </Button>
      </div>
    </div>
  );
};
