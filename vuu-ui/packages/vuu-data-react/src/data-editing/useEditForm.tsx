import {
  Entity,
  buildColumnMap,
  dataSourceRowToEntity,
  messageHasDataRows,
  queryClosest,
  viewportRpcRequest,
} from "@finos/vuu-utils";
import { EditFormProps } from "./EditForm";
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from "react";
import { DataSource, DataValueDescriptor } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import {
  buildValidationChecker,
  getEditValidationRules,
} from "./edit-rule-validation-checker";
import { useDialogContext } from "@finos/vuu-popups";
import { Button } from "@salt-ds/core";

export type EditFormHookProps = Pick<
  EditFormProps,
  "dataSource" | "formFieldDescriptors" | "onSubmit"
>;

type ValidationState = {
  ok: boolean;
  messages: Record<string, string>;
};

type FormEditState = {
  isClean: boolean;
  editedFields: string[];
};

const CLEAN_FORM: FormEditState = {
  isClean: true,
  editedFields: [],
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

const buildFormEditState = (
  entity: Entity | undefined,
  newEntity: Entity,
): FormEditState => {
  if (entity === undefined) {
    return CLEAN_FORM;
  } else {
    const editedFields: string[] = [];
    for (const [fieldName, value] of Object.entries(entity)) {
      if (value !== newEntity[fieldName]) {
        editedFields.push(fieldName);
      }
    }

    return {
      isClean: editedFields.length === 0,
      editedFields,
    };
  }
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

type Resolver = (value: unknown) => void;

export const useEditForm = ({
  dataSource,
  formFieldDescriptors,
  onSubmit,
}: EditFormHookProps) => {
  const { showDialog, closeDialog } = useDialogContext();

  const currentDataSource = useRef<DataSource>();
  const originalEntity = useRef<Entity>();
  const formEditStateRef = useRef<FormEditState>(CLEAN_FORM);
  const validationStateRef = useRef<ValidationState>({
    ok: true,
    messages: {},
  });

  const [entity, _setEntity] = useState<Entity>();
  const [, forceUpdate] = useState({});

  const setFormEditState = useCallback((newState: FormEditState) => {
    formEditStateRef.current = newState;
  }, []);

  const setEntity = useCallback(
    (newEntity: Entity) => {
      setFormEditState(buildFormEditState(originalEntity.current, newEntity));
      _setEntity(newEntity);
    },
    [setFormEditState],
  );

  const submitChanges = useCallback(async () => {
    const rpcResponse = await currentDataSource.current?.rpcCall?.(
      viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"),
    );
    console.log({ rpcResponse });
  }, []);

  const showSaveOrDiscardPrompt = useCallback(async () => {
    let resolver: Resolver | undefined = undefined;
    const save = async () => {
      await submitChanges();
      closeDialog();
      resolver?.("saved");
    };

    const discard = () => {
      closeDialog();
      resolver?.("discarded");
    };

    showDialog(<div>Are you </div>, "Unsaved changes", [
      <Button key="cancel" onClick={discard}>
        Discard Changes
      </Button>,
      <Button key="submit" onClick={save}>
        Save Changes
      </Button>,
    ]);

    return new Promise((resolve) => {
      resolver = resolve;
    });
  }, [closeDialog, showDialog, submitChanges]);

  useMemo(async () => {
    if (dataSource) {
      console.log(`subscribe to dataSource`, {
        dataSource,
      });

      if (formEditStateRef.current.isClean === false) {
        await showSaveOrDiscardPrompt();
      }

      currentDataSource.current = dataSource;

      console.log(`change of dataSource, reset originalEntity`);
      originalEntity.current = undefined;

      const columnMap = buildColumnMap(dataSource.columns);

      dataSource?.subscribe({ range: { from: 0, to: 1 } }, (message) => {
        if (messageHasDataRows(message)) {
          const [row] = message.rows;
          if (row) {
            const entity = dataSourceRowToEntity(row, columnMap);
            if (originalEntity.current === undefined) {
              console.log(`first time in, set the entity from dataSourceRow`);
              originalEntity.current = entity;
              setEntity(entity);
            }
            // Do not overwrite entity here, just check that values returned by server
            // match whats expected
          }
        }
      });
    }
  }, [dataSource, setEntity, showSaveOrDiscardPrompt]);

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

      if (newState.ok && dataSource?.tableSchema) {
        const { key } = dataSource.tableSchema;
        const keyValue = entity?.[key] as string;
        dataSource
          ?.applyEdit(keyValue, fieldName, value)
          .then((rpcResponse) => {
            console.log({ rpcResponse });
          });
      }
    },
    [dataSource, entity, formFieldDescriptors, setValidationState],
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

      setEntity({ ...entity, [fieldName]: value });
    },
    [entity, formFieldDescriptors, setEntity, setValidationState],
  );

  const handleSubmit = useCallback(async () => {
    submitChanges();
    setFormEditState(CLEAN_FORM);
    originalEntity.current = entity;
    onSubmit?.();
    forceUpdate({});
  }, [entity, onSubmit, setFormEditState, submitChanges]);

  const handleCancel = useCallback(async () => {
    // const rpcResponse = await dataSource?.rpcCall?.(
    //   viewportRpcRequest("VP_BULK_EDIT_CANCEL_RPC"),
    // );
    setFormEditState(CLEAN_FORM);
    // console.log({ rpcResponse });
    setEntity(originalEntity.current as Entity);
  }, [setEntity, setFormEditState]);

  const {
    current: { ok, messages: errorMessages },
  } = validationStateRef;

  const {
    current: { isClean, editedFields },
  } = formEditStateRef;

  return {
    editedFields,
    editEntity: entity,
    errorMessages,
    isClean,
    ok,
    onCancel: handleCancel,
    onChange: handleChange,
    onCommit: commitHandler,
    onSubmit: handleSubmit,
  };
};
