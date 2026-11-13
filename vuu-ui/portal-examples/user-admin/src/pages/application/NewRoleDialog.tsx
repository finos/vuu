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
} from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { type ChangeEvent, useEffect, useState } from "react";
import { GroupName } from "../../components/admin-ui/AdminUi";
import {
  createRoleOperation,
  groupLabel,
  validateRoleSuffix,
} from "../../data/admin-plans";
import {
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type {
  ApplicationDetails,
  ApplicationGroup,
} from "../../data/applications";

const classBase = "vuuAdminApplication";

export interface NewRoleDialogProps {
  entry: ApplicationDetails;
  /** The group the dialog was opened from, if any. */
  group?: ApplicationGroup;
  /** Called with the new role's name and the group to add it to, if any. */
  onCreated: (roleName: string, group?: ApplicationGroup) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

/** Creates a role on the application's client, optionally for one group. */
export const NewRoleDialog = ({
  entry,
  group,
  onCreated,
  onOpenChange,
  open,
}: NewRoleDialogProps) => {
  const rpc = useAdminRpc();
  const { showNotification } = useNotifications();
  const [suffix, setSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [addToGroup, setAddToGroup] = useState(true);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const prefix = entry.application.groupPrefix;
  const trimmed = suffix.trim();
  const nameError = validateRoleSuffix(entry, trimmed);

  useEffect(() => {
    if (open) {
      setSuffix("");
      setDescription("");
      setAddToGroup(true);
      setTouched(false);
      setError(undefined);
    }
  }, [open]);

  const create = async () => {
    setTouched(true);
    if (nameError) return;
    setSaving(true);
    const result = await runOperations(rpc, [
      createRoleOperation(entry, trimmed, description.trim()),
    ]);
    setSaving(false);
    if (result.failed) {
      setError(describeFailure(result));
      return;
    }
    const roleName = `${prefix}${trimmed}`;
    const target = group && addToGroup ? group : undefined;
    showNotification({
      type: "toast",
      status: "success",
      header: "Role created",
      content: target
        ? `${roleName} was created. Save to add it to ${groupLabel(entry, target)}.`
        : `${roleName} was created. Add it to a group to grant it.`,
    });
    onCreated(roleName, target);
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open} size="small">
      <DialogHeader
        description={`Roles are permissions on ${entry.application.clientIdentifier}. Users get them through groups.`}
        header="New role"
      />
      <DialogContent>
        <form
          className={`${classBase}-dialogForm`}
          id="new-role-form"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <FormField
            necessity="asterisk"
            validationStatus={touched && nameError ? "error" : undefined}
          >
            <FormFieldLabel>Role name</FormFieldLabel>
            <Input
              bordered
              disabled={saving || !entry.client}
              inputProps={{ "aria-label": "Role name", autoFocus: true }}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSuffix(event.target.value);
                setError(undefined);
              }}
              placeholder="approve"
              startAdornment={
                <span className={`${classBase}-prefix`}>{prefix}</span>
              }
              value={suffix}
            />
            <FormFieldHelperText>
              {touched && nameError ? nameError : "No spaces or slashes."}
            </FormFieldHelperText>
          </FormField>
          <FormField>
            <FormFieldLabel>Description</FormFieldLabel>
            <Input
              bordered
              disabled={saving}
              inputProps={{ "aria-label": "Role description" }}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDescription(event.target.value)
              }
              placeholder="Approve basket orders"
              value={description}
            />
          </FormField>
          {group ? (
            <Checkbox
              checked={addToGroup}
              disabled={saving}
              label={
                <span>
                  Add to <GroupName name={group.groupName} prefix={prefix} />
                </span>
              }
              onChange={(event) => setAddToGroup(event.target.checked)}
            />
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
        </form>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          disabled={saving || !entry.client}
          form="new-role-form"
          sentiment="accented"
          type="submit"
        >
          {saving ? "Creating…" : "Create role"}
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={() => onOpenChange(false)} />
    </Dialog>
  );
};
