import { VuuDataSource } from "@finos/vuu-data-remote";
import { DataSource, TableSchema } from "@finos/vuu-data-types";
import {
  VuuColumnDataType,
  VuuDataRow,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import {
  buildColumnMap,
  hasAction,
  isErrorResponse,
  isValidNumber,
  queryClosest,
  shallowEquals,
} from "@finos/vuu-utils";
import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  useIdMemo,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  ChangeEvent,
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import sessionEditingFormCss from "./SessionEditingForm.css";

export type FormFieldDescriptor = {
  isKeyField?: boolean;
  label?: string;
  name: string;
  type: VuuColumnDataType;
  description: string;
  readonly?: boolean;
  required?: boolean;
};

export type FormConfig = {
  title: string;
  key: string;
  fields: FormFieldDescriptor[];
};

export interface SessionEditingFormProps
  extends HTMLAttributes<HTMLDivElement> {
  config: FormConfig;
  onClose?: () => void;
  dataSource?: DataSource;
  schema?: TableSchema;
}

const classBase = "vuuSessionEditingForm";

const getField = (
  fields: FormFieldDescriptor[],
  name: string
): FormFieldDescriptor => {
  const field = fields.find((f) => f.name === name);
  if (field) {
    return field;
  } else {
    throw Error(`SessionEditingForm, no field '${name}' found`);
  }
};

const getFieldNameAndValue = ({
  target,
}: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>): [
  string,
  string
] => {
  const formField = queryClosest(target, ".saltFormField");
  if (formField) {
    const {
      dataset: { field },
    } = formField;
    if (field === undefined) {
      throw Error("SessionEditingForm, form field has no field data attribute");
    }
    return [field, target.value];
  } else {
    throw Error("Form control is not enclosed in FormField");
  }
};

const Status = {
  uninitialised: 0,
  unchanged: 1,
  changed: 2,
  invalid: 3,
};

function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined?: false
): VuuRowDataItemType | undefined;
function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined: true
): VuuRowDataItemType;
function getTypedValue(
  value: string,
  type: VuuColumnDataType,
  throwIfUndefined = false
): VuuRowDataItemType | undefined {
  switch (type) {
    case "int":
    case "long": {
      const typedValue = parseInt(value, 10);
      if (isValidNumber(typedValue)) {
        return typedValue;
      } else if (throwIfUndefined) {
        throw Error("SessionEditingForm getTypedValue");
      } else {
        return undefined;
      }
    }

    case "double": {
      const typedValue = parseFloat(value);
      if (isValidNumber(typedValue)) {
        return typedValue;
      }
      return undefined;
    }

    case "boolean":
      return value === "true" ? true : false;
    default:
      return value;
  }
}

const getDataSource = (
  dataSource?: DataSource,
  schema?: TableSchema
): DataSource => {
  if (dataSource) {
    return dataSource;
  } else if (schema) {
    return new VuuDataSource({
      bufferSize: 0,
      table: schema.table,
      columns: schema.columns.map((col) => col.name),
    }) as DataSource;
  } else {
    throw Error(
      "SessionEditingForm: either a DataSource or a TableSchema must be provided"
    );
  }
};

type FormValues = { [key: string]: VuuRowDataItemType | undefined };

export const SessionEditingForm = ({
  className,
  config: { fields, key: keyField },
  dataSource: dataSourceProp,
  id: idProp,
  onClose,
  schema,
  ...htmlAttributes
}: SessionEditingFormProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-session-editing-form",
    css: sessionEditingFormCss,
    window: targetWindow,
  });

  const [fieldStatusValues, setFieldStatusValues] = useState<
    Record<string, string | undefined>
  >({});
  const [values, setValues] = useState<FormValues>();
  const [errorMessage, setErrorMessage] = useState("");
  const formContentRef = useRef<HTMLDivElement>(null);
  const initialDataRef = useRef<FormValues>();
  const dataStatusRef = useRef(Status.uninitialised);

  const dataSource = useMemo(() => {
    const ds = getDataSource(dataSourceProp, schema);
    const { columns } = ds;
    const columnMap = buildColumnMap(ds.columns);

    const applyServerData = (data: VuuDataRow) => {
      if (columnMap) {
        const values: { [key: string]: VuuRowDataItemType } = {};
        for (const column of columns) {
          values[column] = data[columnMap[column]];
        }
        if (dataStatusRef.current === Status.uninitialised) {
          dataStatusRef.current = Status.unchanged;
          initialDataRef.current = values;
        }
        setValues(values);
      }
    };

    ds.subscribe({ range: { from: 0, to: 5 } }, (message) => {
      if (message.type === "viewport-update" && message.rows) {
        if (dataStatusRef.current === Status.uninitialised) {
          applyServerData(message.rows[0]);
        } else {
          console.log("what do we do with server updates");
        }
      }
    });
    return ds;
  }, [dataSourceProp, schema]);

  const id = useIdMemo(idProp);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      const [field, value] = getFieldNameAndValue(evt);
      const { type } = getField(fields, field);
      const typedValue = getTypedValue(value, type);
      setValues((values = {}) => {
        const newValues = {
          ...values,
          [field]: typedValue,
        };
        const notUpdated = shallowEquals(newValues, initialDataRef.current);
        dataStatusRef.current = notUpdated
          ? Status.unchanged
          : typedValue !== undefined
          ? Status.changed
          : Status.invalid;
        return newValues;
      });
    },
    [fields]
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (evt) => {
      const [field, value] = getFieldNameAndValue(evt);
      const rowKey = values?.[keyField];
      // TODO link this with client side validation if we're going to use it
      const { type } = getField(fields, field);
      const typedValue = getTypedValue(value, type, true);
      if (typeof rowKey === "string") {
        dataSource
          .menuRpcCall({
            rowKey,
            field: field,
            value: typedValue,
            type: "VP_EDIT_CELL_RPC",
          })
          .then((response) => {
            if (isErrorResponse(response)) {
              console.log(`edit rejected ${response.error}`);
              setFieldStatusValues((map) => ({
                ...map,
                [field]: response.error,
              }));
            } else {
              setFieldStatusValues((map) => ({
                ...map,
                [field]: undefined,
              }));
            }
          });
      }
    },
    [dataSource, fields, keyField, values]
  );

  const applyAction = useCallback(
    (action: unknown) => {
      if (typeof action === "object" && action !== null) {
        if ("type" in action && action.type === "CLOSE_DIALOG_ACTION") {
          onClose?.();
        }
      }
    },
    [onClose]
  );

  const handleSubmit = useCallback(async () => {
    const response = await dataSource.menuRpcCall({
      type: "VP_EDIT_SUBMIT_FORM_RPC",
    });
    if (isErrorResponse(response)) {
      setErrorMessage(response.error);
    } else if (hasAction(response)) {
      applyAction(response.action);
    }
  }, [applyAction, dataSource]);

  const handleKeyDown = useCallback(
    (evt) => {
      if (evt.key === "Enter" && dataStatusRef.current === Status.changed) {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const getFormControl = (field: FormFieldDescriptor) => {
    const value = String(values?.[field.name] ?? "");
    if (field.readonly || field.name === keyField) {
      return (
        <div className={`${classBase}-fieldValue vuuReadOnly`}>{value}</div>
      );
    } else {
      return (
        <Input
          className={`${classBase}-fieldValue`}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          id={`${id}-input-${field.name}`}
        />
      );
    }
  };

  useEffect(() => {
    if (formContentRef.current) {
      const firstInput = formContentRef.current.querySelector(
        "input"
      ) as HTMLInputElement;
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
          firstInput.select();
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (dataSource) {
        dataSource.unsubscribe();
      }
    };
  }, [dataSource]);

  const isDirty = dataStatusRef.current === Status.changed;
  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {errorMessage ? (
        <div
          className={`${classBase}-errorBanner`}
          data-icon="error"
          title={errorMessage}
        >
          Error, edit(s) not saved
        </div>
      ) : undefined}
      <div
        className={`${classBase}-content`}
        ref={formContentRef}
        onKeyDown={handleKeyDown}
      >
        {fields.map((field) => (
          <FormField
            className={`${classBase}-field`}
            data-field={field.name}
            key={field.name}
            necessity={field.required ? "required" : "optional"}
            readOnly={field.readonly}
            validationStatus={
              fieldStatusValues[field.name] ? "error" : undefined
            }
          >
            <FormFieldLabel>{field?.label ?? field.description}</FormFieldLabel>
            {getFormControl(field)}
            <FormFieldHelperText>
              {fieldStatusValues[field.name] ?? ""}
            </FormFieldHelperText>
          </FormField>
        ))}
      </div>
      <div className={`${classBase}-buttonbar salt-theme salt-density-high`}>
        <Button
          type="submit"
          variant="cta"
          disabled={!isDirty}
          onClick={handleSubmit}
        >
          Submit
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
