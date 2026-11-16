import {
  Button,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import {
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";
import { type ColumnSetModel, getColumnSetNameError } from "./ColumnSetModel";
import { useColumnSetsState } from "./useColumnSetModel";

import columnSetHeaderCss from "./ColumnSetHeader.css";

const classBase = "vuuColumnSetHeader";

type EditMode = "save-as" | "rename";

export interface ColumnSetHeaderProps extends HTMLAttributes<HTMLDivElement> {
  columnSetModel: ColumnSetModel;
}

/**
 * Shown at the top of the ColumnPicker. Names the column set in view, with
 * 'Save as…' to save the columns in view as a new set and a menu to rename,
 * revert or delete the active set.
 */
export const ColumnSetHeader = ({
  className,
  columnSetModel,
  ...htmlAttributes
}: ColumnSetHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-set-header",
    css: columnSetHeaderCss,
    window: targetWindow,
  });

  const { activeColumnSet: activeName, columnSets } =
    useColumnSetsState(columnSetModel);
  const activeColumnSet = columnSetModel.activeColumnSet;
  const [editMode, setEditMode] = useState<EditMode | undefined>();
  const [name, setName] = useState("");
  const [showError, setShowError] = useState(false);

  const currentName = editMode === "rename" ? activeName : undefined;
  const nameError = getColumnSetNameError(name, columnSets, currentName);
  const columnCount = columnSetModel.columnModel.selectedColumns.length;

  const beginEdit = useCallback(
    (mode: EditMode) => {
      setEditMode(mode);
      setName(mode === "rename" ? (activeName ?? "") : "");
      setShowError(false);
    },
    [activeName],
  );

  const cancelEdit = useCallback(() => {
    setEditMode(undefined);
  }, []);

  const save = useCallback(() => {
    if (nameError) {
      setShowError(true);
    } else if (editMode === "save-as") {
      columnSetModel.saveAs(name);
      setEditMode(undefined);
    } else if (editMode === "rename" && activeName !== undefined) {
      columnSetModel.rename(activeName, name);
      setEditMode(undefined);
    }
  }, [activeName, columnSetModel, editMode, name, nameError]);

  const handleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    setName(evt.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        save();
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        evt.stopPropagation();
        cancelEdit();
      }
    },
    [cancelEdit, save],
  );

  if (editMode) {
    const label =
      editMode === "save-as" ? "New column set" : "Rename column set";
    const helpText =
      showError && nameError
        ? nameError
        : editMode === "save-as"
          ? `Saves the ${columnCount} column${columnCount === 1 ? "" : "s"} in view, in this order, and switches to the new set.`
          : undefined;
    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, `${classBase}-editing`, className)}
      >
        <FormField
          validationStatus={showError && nameError ? "error" : undefined}
        >
          <FormFieldLabel>{label}</FormFieldLabel>
          <Input
            className={`${classBase}-input`}
            inputProps={{
              autoFocus: true,
              onKeyDown: handleKeyDown,
              placeholder: "Column set name",
            }}
            onChange={handleChange}
            value={name}
          />
          {helpText ? (
            <FormFieldHelperText>{helpText}</FormFieldHelperText>
          ) : null}
        </FormField>
        <div className={`${classBase}-buttons`}>
          <Button
            appearance="bordered"
            onClick={cancelEdit}
            sentiment="neutral"
          >
            Cancel
          </Button>
          <Button
            appearance="solid"
            disabled={name.trim() === ""}
            onClick={save}
            sentiment="accented"
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <span className={`${classBase}-label`}>Column set</span>
      <div className={`${classBase}-line`}>
        <span
          className={cx(`${classBase}-name`, {
            [`${classBase}-unnamed`]: activeColumnSet === undefined,
          })}
        >
          {activeColumnSet?.name ?? "Unnamed"}
        </span>
        <Button
          appearance="bordered"
          onClick={() => beginEdit("save-as")}
          sentiment="neutral"
        >
          Save as…
        </Button>
        {activeColumnSet ? (
          <Menu placement="bottom-end">
            <MenuTrigger>
              <IconButton
                appearance="bordered"
                aria-label="Column set actions"
                icon="more-horiz"
                sentiment="neutral"
              />
            </MenuTrigger>
            <MenuPanel className={`${classBase}-menu`}>
              <MenuItem onClick={() => beginEdit("rename")}>Rename</MenuItem>
              <MenuItem
                disabled={!columnSetModel.isModified}
                onClick={() => columnSetModel.revertToSaved()}
              >
                Revert to saved
              </MenuItem>
              <MenuItem
                className={`${classBase}-delete`}
                onClick={() => columnSetModel.delete(activeColumnSet.name)}
              >
                Delete column set
              </MenuItem>
            </MenuPanel>
          </Menu>
        ) : null}
      </div>
    </div>
  );
};
