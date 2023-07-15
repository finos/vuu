import { clsx } from "clsx";
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
} from "react";
import { useControlled } from "@salt-ds/core";
import { Input } from "@heswell/salt-lab";

import "./EditableLabel.css";

const classBase = "vuuEditableLabel";

export interface EditableLabelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  defaultEditing?: boolean;
  defaultValue?: string;
  editing?: boolean;
  onEnterEditMode: () => void;
  onChange?: (value: string) => void;
  onExitEditMode: (
    originalLabel: string | undefined,
    editedLabel: string | undefined,
    allowDeactivation?: boolean,
    editCancelled?: boolean
  ) => void;
  defaultIsEditing?: boolean;
  value?: string;
}

export const EditableLabel = forwardRef(function EditableLabel(
  {
    className: classNameProp,
    defaultEditing,
    defaultValue,
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

  const setEditing = useCallback((value: boolean) => {
    _setEditing((editingRef.current = value));
  }, []);

  const initialValue = useRef(value);

  useLayoutEffect(() => {
    if (editing) {
      if (inputRef.current !== null) {
        inputRef.current.select();
        inputRef.current.focus();
      }
    }
  }, [editing, inputRef]);

  const enterEditMode = useCallback(() => {
    setEditing(true);
    // ignoreBlur.current = false;
    onEnterEditMode && onEnterEditMode();
  }, [onEnterEditMode, setEditing]);

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

  const handleDoubleClick = () => {
    enterEditMode();
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

  const className = clsx(classBase, classNameProp, {
    [`${classBase}-editing`]: editing,
  });
  return (
    <div
      {...restProps}
      className={className}
      onDoubleClick={handleDoubleClick}
      data-text={value}
      ref={forwardedRef}
    >
      {editing ? (
        <Input
          inputProps={{ className: `${classBase}-input` }}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          style={{ padding: 0 }}
          textAlign="left"
        />
      ) : (
        value
      )}
    </div>
  );
});
