import type { DataSource, DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  CommitHandler,
  Entity,
  Range,
  buildColumnMap,
  dataSourceRowToEntity,
  messageHasDataRows,
  queryClosest,
} from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import {
  FocusEventHandler,
  SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { UnsavedChangesReport } from "./UnsavedChangesReport";
import {
  buildValidationChecker,
  getEditValidationRules,
} from "./edit-rule-validation-checker";
import {
  CLEAN_FORM,
  FormEditState,
  buildFormEditState,
} from "./form-edit-state";
import { useModal } from "@vuu-ui/vuu-ui-controls";

export interface EditFormHookProps {
  dataSource?: DataSource;
  formFieldDescriptors: DataValueDescriptor[];
  onSubmit?: () => void;
}

type ValidationState = {
  ok: boolean;
  messages: Record<string, string>;
};

const CLEAN_VALIDATION: ValidationState = {
  ok: true,
  messages: {},
};

const getValidationChecker = (
  descriptor: DataValueDescriptor,
  editPhase: "change" | "commit",
) => {
  const rules = getEditValidationRules(descriptor, editPhase) ?? [];
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

type Resolver = (value: unknown) => void;

export const useEditForm = ({
  dataSource,
  formFieldDescriptors,
  onSubmit,
}: EditFormHookProps) => {
  const { showDialog, closeDialog } = useModal();

  const currentDataSource = useRef<DataSource>(undefined);
  const formFieldsContainerRef = useRef<HTMLDivElement>(null);
  const entityRef = useRef<Entity>(undefined);
  const focusedFieldRef = useRef("");
  const originalEntityRef = useRef<Entity>(undefined);
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
      setFormEditState(
        buildFormEditState(originalEntityRef.current, newEntity),
      );
      entityRef.current = newEntity;
      _setEntity(newEntity);
    },
    [setFormEditState],
  );

  const submitChanges = useCallback(async () => {
    const rpcResponse = await currentDataSource.current?.rpcRequest?.({
      params: {},
      rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
      type: "RPC_REQUEST",
    });
    console.log({ rpcResponse });
  }, []);

  const showSaveOrDiscardPrompt = useCallback(async () => {
    const { current: currentEntity } = entityRef;
    const { current: originalEntity } = originalEntityRef;
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

    requestAnimationFrame(() => {
      showDialog(
        <UnsavedChangesReport
          entity={originalEntity as Entity}
          editedEntity={currentEntity as Entity}
        />,
        "Unsaved Changes",
        [
          <Button key="cancel" onClick={discard}>
            Discard Changes
          </Button>,
          <Button key="submit" onClick={save}>
            Save Changes
          </Button>,
        ],
        true, // hideCloseButton
      );
    });

    return new Promise((resolve) => {
      resolver = resolve;
    });
  }, [closeDialog, showDialog, submitChanges]);

  useMemo(async () => {
    if (dataSource) {
      if (formEditStateRef.current.isClean === false) {
        await showSaveOrDiscardPrompt();
      }

      currentDataSource.current = dataSource;

      originalEntityRef.current = undefined;

      const columnMap = buildColumnMap(dataSource.columns);

      dataSource?.subscribe({ range: Range(0, 1) }, (message) => {
        if (messageHasDataRows(message)) {
          const [row] = message.rows;
          if (row) {
            const entity = dataSourceRowToEntity(row, columnMap);
            if (originalEntityRef.current === undefined) {
              originalEntityRef.current = entity;
              setEntity(entity);
            }

            const { editedFields } = buildFormEditState(
              entityRef.current,
              entity,
            );

            // for controls which do not yield incremental changes, e.g dropdown, calendar
            // we apply the server update to our entity.
            if (editedFields.length === 1) {
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
    validationStateRef.current = state;
    forceUpdate({});
  }, []);

  const handleFieldCommit = useCallback<CommitHandler<HTMLElement>>(
    (_, value) => {
      const { current: fieldName } = focusedFieldRef;
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

  const handleFieldChange = useCallback(
    (evt: SyntheticEvent<HTMLInputElement>) => {
      const { current: fieldName } = focusedFieldRef;
      if (fieldName) {
        const input = queryClosest<HTMLInputElement>(evt.target, "input", true);
        const dataDescriptor = find(formFieldDescriptors, fieldName);
        const value = input.value as string;
        const { current: state } = validationStateRef;
        const newState = nextValidationState(state, dataDescriptor, value);
        if (newState !== state) {
          setValidationState(newState);
        }

        setEntity({ ...entity, [fieldName]: value });
      }
    },
    [entity, formFieldDescriptors, setEntity, setValidationState],
  );

  const handleFormSubmit = useCallback(async () => {
    submitChanges();
    setFormEditState(CLEAN_FORM);
    originalEntityRef.current = entity;
    onSubmit?.();
    forceUpdate({});
  }, [entity, onSubmit, setFormEditState, submitChanges]);

  const handleFormCancel = useCallback(async () => {
    // const rpcResponse = await dataSource?.rpcCall?.(
    //   viewportRpcRequest("VP_BULK_EDIT_CANCEL_RPC"),
    // );
    setFormEditState(CLEAN_FORM);
    setValidationState(CLEAN_VALIDATION);
    // console.log({ rpcResponse });
    setEntity(originalEntityRef.current as Entity);
  }, [setEntity, setFormEditState, setValidationState]);

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
    formFieldsContainerRef,
    isClean,
    ok,
    onCancel: handleFormCancel,
    onChange: handleFieldChange,
    onCommit: handleFieldCommit,
    onFocus: handleFocus,
    onSubmit: handleFormSubmit,
  };
};
