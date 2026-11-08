import {
  Button,
  Checkbox,
  Dropdown,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
  Option,
  Tag,
  Text,
} from "@salt-ds/core";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useMemo,
  useState,
} from "react";
import {
  AccessTag,
  GroupName,
  plural,
  RoleName,
} from "../../components/admin-ui/AdminUi";
import { UserPicker } from "../../components/UserPicker";
import {
  createGroupOperations,
  groupDisplayName,
  groupLabel,
  validateGroupSuffix,
} from "../../data/admin-plans";
import {
  type AdminOperation,
  describeFailure,
  runOperations,
  useAdminRpc,
} from "../../data/admin-rpc";
import type {
  ApplicationDetails,
  ApplicationGroup,
} from "../../data/applications";
import type { UserSummary } from "../../data/useApplicationUsers";
import { useApplicationModel } from "../../data/useApplicationModel";

const classBase = "vuuAdminApplication";
const EMPTY_START = "__empty__";

export interface NewGroupPanelProps {
  entry: ApplicationDetails;
  onClose: () => void;
}

/** Creates an application group, with its roles and, optionally, its first members. */
export const NewGroupPanel = ({ entry, onClose }: NewGroupPanelProps) => {
  const rpc = useAdminRpc();
  const { model } = useApplicationModel();
  const { showNotification } = useNotifications();
  const [suffix, setSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [roleIds, setRoleIds] = useState<ReadonlySet<string>>(new Set());
  const [members, setMembers] = useState<ReadonlyMap<string, UserSummary>>(
    new Map(),
  );
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<{
    message: string;
    remaining: AdminOperation[];
  }>();
  const prefix = entry.application.groupPrefix;
  const trimmed = suffix.trim();
  const nameError = validateGroupSuffix(model, entry, trimmed);
  const groupName = `${prefix}${trimmed}`;
  const selectedRoles = entry.roles.filter(({ roleId }) => roleIds.has(roleId));

  const operations = useMemo(
    () =>
      createGroupOperations(entry, {
        description: description.trim(),
        roleIds: [...roleIds],
        suffix: trimmed,
        users: [...members.values()],
      }),
    [description, entry, members, roleIds, trimmed],
  );

  const startFrom = (
    _event: SyntheticEvent,
    [group]: (ApplicationGroup | typeof EMPTY_START)[],
  ) => {
    setRoleIds(
      new Set(
        group && group !== EMPTY_START
          ? group.roleIds.filter(
              (roleId) => roleId !== entry.accessRole?.roleId,
            )
          : [],
      ),
    );
  };

  const save = async (pending: readonly AdminOperation[]) => {
    setSaving(true);
    const result = await runOperations(rpc, pending);
    setSaving(false);
    if (result.failed) {
      setFailure({
        message: describeFailure(result),
        remaining: result.remaining,
      });
      return;
    }
    showNotification({
      type: "toast",
      status: "success",
      header: "Group created",
      content: `${groupDisplayName(groupName, prefix)} was created${members.size ? ` with ${plural(members.size, "member")}` : ""}.`,
    });
    onClose();
  };

  // Once the group exists its name and contents are fixed; only a retry remains.
  const created = failure && failure.remaining[0]?.rpcName !== "addGroup";

  return (
    <form
      className={`${classBase}-panelForm`}
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (created) void save(failure.remaining);
        else if (!nameError) void save(operations);
      }}
    >
      <FormField
        necessity="asterisk"
        validationStatus={touched && nameError ? "error" : undefined}
      >
        <FormFieldLabel>Group name</FormFieldLabel>
        <Input
          bordered
          disabled={saving || created}
          inputProps={{ "aria-label": "Group name" }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSuffix(event.target.value)
          }
          placeholder="e.g. risk"
          startAdornment={
            <span className={`${classBase}-prefix`}>{prefix}</span>
          }
          value={suffix}
        />
        <FormFieldHelperText>
          {touched && nameError
            ? nameError
            : `The ${prefix} prefix links the group to ${entry.application.title}. No spaces or slashes.`}
        </FormFieldHelperText>
      </FormField>

      <FormField>
        <FormFieldLabel>Description</FormFieldLabel>
        <Input
          bordered
          disabled={saving || created}
          inputProps={{ "aria-label": "Group description" }}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDescription(event.target.value)
          }
          placeholder="Read only view of baskets data"
          value={description}
        />
        <FormFieldHelperText>
          Shown on the group in User Admin and in Keycloak.
        </FormFieldHelperText>
      </FormField>

      {entry.groups.length > 0 ? (
        <FormField>
          <FormFieldLabel>Start from</FormFieldLabel>
          <Dropdown<ApplicationGroup | typeof EMPTY_START>
            aria-label="Start from"
            bordered
            disabled={saving || created}
            onSelectionChange={startFrom}
            placeholder="Empty group (access only)"
            valueToString={(value) =>
              value === EMPTY_START
                ? "Empty group (access only)"
                : `Copy roles from ${groupLabel(entry, value)}`
            }
          >
            <Option value={EMPTY_START}>Empty group (access only)</Option>
            {entry.groups.map((group) => (
              <Option key={group.groupId} value={group}>
                Copy roles from {groupLabel(entry, group)}
              </Option>
            ))}
          </Dropdown>
        </FormField>
      ) : null}

      <fieldset className={`${classBase}-fieldset`}>
        <legend>Roles in this group</legend>
        <div className={`${classBase}-option ${classBase}-optionSelected`}>
          <Checkbox
            checked
            disabled
            label={<RoleName>{entry.application.accessRole}</RoleName>}
          />
          <Text color="secondary" styleAs="label">
            Always included. Lets members open {entry.application.title}.
          </Text>
        </div>
        {entry.roles.map((role) => (
          <div
            className={`${classBase}-option${roleIds.has(role.roleId) ? ` ${classBase}-optionSelected` : ""}`}
            key={role.roleId}
          >
            <Checkbox
              checked={roleIds.has(role.roleId)}
              disabled={saving || created}
              label={<RoleName>{role.roleName}</RoleName>}
              onChange={(event) => {
                const next = new Set(roleIds);
                if (event.target.checked) next.add(role.roleId);
                else next.delete(role.roleId);
                setRoleIds(next);
              }}
            />
            {role.description ? (
              <Text color="secondary" styleAs="label">
                {role.description}
              </Text>
            ) : null}
          </div>
        ))}
        {entry.roles.length === 0 ? (
          <Text color="secondary">
            {entry.application.title} has no roles of its own yet. Add them on
            the Groups &amp; roles tab.
          </Text>
        ) : null}
      </fieldset>

      <fieldset className={`${classBase}-fieldset ${classBase}-members`}>
        <legend>
          Add members <Text color="secondary">(optional)</Text>
        </legend>
        <UserPicker
          accessRole={entry.application.accessRole}
          aria-label="Users"
          onChange={setMembers}
          selected={members}
        />
      </fieldset>

      <div className={`${classBase}-summary`} aria-live="polite">
        <Text styleAs="label">
          {trimmed ? (
            <GroupName name={groupName} prefix={prefix} />
          ) : (
            <strong>{prefix}…</strong>
          )}{" "}
          grants{" "}
        </Text>
        <AccessTag />
        {selectedRoles.map((role) => (
          <Tag key={role.roleId}>{role.roleName}</Tag>
        ))}
        <Text styleAs="label">
          {members.size ? ` to ${plural(members.size, "user")}.` : ""}
        </Text>
      </div>

      {failure ? <p role="alert">{failure.message}</p> : null}

      <div className="vuuIdentityAdmin-panelFooter">
        <Button disabled={saving} onClick={onClose} type="button">
          {created ? "Close" : "Cancel"}
        </Button>
        <Button disabled={saving} sentiment="accented" type="submit">
          {saving ? "Saving..." : created ? "Retry" : "Create group"}
        </Button>
      </div>
    </form>
  );
};
