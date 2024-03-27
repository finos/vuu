import cx from "clsx";
import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useLayoutEffect,
  forwardRef,
  ForwardedRef,
  ReactElement,
  useRef,
  HTMLAttributes,
  useImperativeHandle,
} from "react";
import { Input, useControlled } from "@salt-ds/core";

import "./EditableLabel.css";

const classBase = "vuuEditableLabel";

export type ExitEditModeHandler = (
  originalLabel: string | undefined,
  editedLabel: string | undefined,
  allowDeactivation?: boolean,
  editCancelled?: boolean
) => void;

export interface EditAPI {
  beginEdit: () => void;
}

export const NullEditAPI: EditAPI = {
  beginEdit: () => undefined,
};

export interface EditableLabelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  defaultEditing?: boolean;
  defaultValue?: string;
  editLabelApiRef?: ForwardedRef<EditAPI>;
  editing?: boolean;
  onEnterEditMode: () => void;
  onChange?: (value: string) => void;
  onExitEditMode: ExitEditModeHandler;
  defaultIsEditing?: boolean;
  value?: string;
}

export const EditableLabel = forwardRef(function EditableLabel(
  {
    className: classNameProp,
    defaultEditing,
    defaultValue,
    editLabelApiRef,
    editing: editingProp,
    onChange,
    onEnterEditMode,
    onExitEditMode,
    value: valueProp,
    ...restProps
  }: EditableLabelProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
): ReactElement<EditableLabelProps> {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editingRef = useRef<boolean>(false);

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? "",
    name: "EditableLabel",
    state: "value",
  });

  const [editing, _setEditing] = useControlled({
    controlled: editingProp,
    default: defaultEditing ?? false,
    name: "EditableLabel",
    state: "editing",
  });

  const setEditing = useCallback(
    (value: boolean) => {
      _setEditing((editingRef.current = value));
    },
    [_setEditing]
  );

  const initialValue = useRef(value);

  useLayoutEffect(() => {
    if (editing) {
      if (inputRef.current !== null) {
        inputRef.current.select();
        inputRef.current.focus();
      }
    }
  }, [editing, inputRef]);

  const beginEdit = useCallback(() => {
    setEditing(true);
    onEnterEditMode?.();
  }, [onEnterEditMode, setEditing]);

  useImperativeHandle(
    editLabelApiRef,
    () => ({
      beginEdit,
    }),
    [beginEdit]
  );

  const exitEditMode = ({
    cancelEdit = false,
    allowDeactivation = false,
  } = {}) => {
    setEditing(false);
    const originalValue = initialValue.current;
    if (originalValue !== value) {
      if (cancelEdit) {
        setValue(originalValue);
      } else {
        initialValue.current = value;
      }
    }
    onExitEditMode &&
      onExitEditMode(originalValue, value, allowDeactivation, cancelEdit);
  };

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target;
    setValue(value);
    onChange && onChange(value);
  };

  // We need the ref here as the blur fires before setEditing has taken effect,
  // so we get a double call to exitEditMode if edit is cancelled.
  const handleBlur = () => {
    if (editingRef.current) {
      exitEditMode({ allowDeactivation: true });
    }
  };

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (editing && evt.key === "Enter") {
      evt.stopPropagation();
      // we are likely to lose focus as a consequence of user response
      // to exitEdit transition, don't want it to trigger another
      //shouldn't we call setEditing here in case we are in uncontrolled mode ?
      exitEditMode();
    } else if (evt.key === "ArrowRight" || evt.key === "ArrowLeft") {
      evt.stopPropagation();
    } else if (evt.key === "Escape") {
      exitEditMode({ cancelEdit: true });
    }
  };

  const className = cx(classBase, classNameProp, {
    [`${classBase}-editing`]: editing,
  });
  return (
    <div
      {...restProps}
      className={className}
      data-text={value}
      ref={forwardedRef}
    >
      {editing ? (
        <Input
          inputProps={{ className: `${classBase}-input`, spellCheck: false }}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          style={{ padding: 0 }}
          textAlign="left"
          variant="secondary"
        />
      ) : (
        <span className={`${classBase}-label`}>{value}</span>
      )}
    </div>
  );
});
