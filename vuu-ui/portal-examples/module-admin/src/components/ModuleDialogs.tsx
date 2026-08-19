import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Text,
} from "@salt-ds/core";
import { useState } from "react";
import { inputValue } from "./ModuleForm";
import type { ModuleView } from "../data/module-model";
import { plural } from "../data/module-model";

const classBase = "vuuModuleDialog";

export const DisableModuleDialog = ({
  module,
  onCancel,
  onConfirm,
}: {
  module: ModuleView;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const children = module.children.filter(({ enabled }) => enabled);
  return (
    <Dialog
      className={classBase}
      onOpenChange={(open) => !open && onCancel()}
      open
      size="small"
      status="warning"
    >
      <DialogHeader header={`Disable ${module.title}?`} />
      <DialogContent>
        <Text>
          Module discovery stops offering <strong>{module.title}</strong>. It
          disappears from the portal menu for every user; users with it open
          keep it until they reload.
        </Text>
        <ul className={`${classBase}-list`}>
          <li>Configuration and access role are kept.</li>
          <li>You can enable it again at any time.</li>
          {children.length > 0 ? (
            <li>
              Child {children.length === 1 ? "module" : "modules"}{" "}
              <strong>{children.map(({ title }) => title).join(", ")}</strong>{" "}
              can no longer be opened from it.
            </li>
          ) : null}
        </ul>
      </DialogContent>
      <DialogActions>
        <Button appearance="transparent" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} sentiment="accented">
          Disable module
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={onCancel} />
    </Dialog>
  );
};

export const DeleteModuleDialog = ({
  module,
  onCancel,
  onConfirm,
  onDisableInstead,
}: {
  module: ModuleView;
  onCancel: () => void;
  onConfirm: (deleteChildren: boolean) => void;
  onDisableInstead?: () => void;
}) => {
  const [confirmation, setConfirmation] = useState("");
  const [deleteChildren, setDeleteChildren] = useState(false);
  const childCount = module.children.length;
  const blocked = childCount > 0 && !deleteChildren;
  const confirmed = confirmation === module.name;
  const count = 1 + (deleteChildren ? childCount : 0);

  return (
    <Dialog
      className={classBase}
      onOpenChange={(open) => !open && onCancel()}
      open
      size="medium"
      status="error"
    >
      <DialogHeader header={`Delete ${module.title}?`} />
      <DialogContent>
        <Text>
          The module is removed from module discovery. Its configuration can't
          be recovered. The remote itself is not affected.
        </Text>
        <ul className={`${classBase}-list`}>
          <li>
            Users holding{" "}
            <code>{module.effectiveAccessRole || "its access role"}</code> lose
            access immediately. The role itself is kept in User Admin.
          </li>
          {module.enabled ? (
            <li>To hide it but keep its configuration, disable it instead.</li>
          ) : null}
        </ul>
        {childCount > 0 ? (
          <div className={`${classBase}-children`}>
            <Checkbox
              checked={deleteChildren}
              label={`Also delete ${plural(childCount, "child module")}: ${module.children
                .map(({ title }) => title)
                .join(", ")}`}
              onChange={(event) => setDeleteChildren(event.target.checked)}
            />
            {blocked ? (
              <Text color="secondary" styleAs="label">
                A module with child modules can only be deleted together with
                them.
              </Text>
            ) : null}
          </div>
        ) : null}
        <FormField className={`${classBase}-confirm`}>
          <FormFieldLabel>
            Type <code>{module.name}</code> to confirm
          </FormFieldLabel>
          <Input
            bordered
            inputProps={{ autoComplete: "off", spellCheck: false }}
            onChange={(event) => setConfirmation(inputValue(event))}
            value={confirmation}
          />
          <FormFieldHelperText>This can't be undone.</FormFieldHelperText>
        </FormField>
      </DialogContent>
      <DialogActions>
        {module.enabled && onDisableInstead ? (
          <Button appearance="transparent" onClick={onDisableInstead}>
            Disable instead
          </Button>
        ) : null}
        <span className={`${classBase}-spacer`} />
        <Button appearance="transparent" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!confirmed || blocked}
          onClick={() => onConfirm(deleteChildren)}
          sentiment="negative"
        >
          Delete {count === 1 ? "module" : plural(count, "module")}
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={onCancel} />
    </Dialog>
  );
};
