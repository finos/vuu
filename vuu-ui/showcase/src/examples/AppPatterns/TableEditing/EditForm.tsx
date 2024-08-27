import { VuuInput } from "@finos/vuu-ui-controls";
import { queryClosest } from "@finos/vuu-utils";
import { Button, FormField, FormFieldLabel } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";

import "./EditForm.css";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { Instrument, EmptyInstrument } from "./instrument-editing";

const classBase = "EditForm";

export interface EditFormProps extends HTMLAttributes<HTMLDivElement> {
  editEntity?: Instrument;
  onChangeFormField: (evt: any) => void;
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

export const EditForm = ({
  className,
  editEntity = EmptyInstrument,
  onChangeFormField,
  onCommitFieldValue,
  onSubmit,
  ...htmlAttributes
}: EditFormProps) => {
  const commitHandler = useCallback(
    (evt, value) => {
      const fieldName = getField(evt.target);
      onCommitFieldValue(fieldName, value);
    },
    [onCommitFieldValue],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <FormField data-field="currency">
        <FormFieldLabel>Currency</FormFieldLabel>
        <VuuInput
          onChange={onChangeFormField}
          onCommit={commitHandler}
          value={editEntity.currency}
        />
      </FormField>
      <FormField data-field="exchange">
        <FormFieldLabel>Exchange</FormFieldLabel>
        <VuuInput
          onChange={onChangeFormField}
          onCommit={commitHandler}
          value={editEntity.exchange}
        />
      </FormField>
      <div className={`${classBase}-buttons`}>
        <Button onClick={onSubmit}>Save</Button>
      </div>
    </div>
  );
};
