import {
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  ListBox,
  Option,
} from "@salt-ds/core";
import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import { useAdminConfig } from "../data/AdminDataContext";
import { columnFor, type AdminRecord } from "../data/admin-contract";
import { resolveModuleAccessValues } from "./ModuleAccessCell";

export const ModuleAccessField = ({ record }: { record?: AdminRecord }) => {
  const config = useAdminConfig();
  const { remoteModules } = usePortalModuleRegistry();
  const value = record?.[columnFor(config, "users", "module_access")];
  const values = resolveModuleAccessValues(value, remoteModules);

  return (
    <FormField disabled>
      <FormFieldLabel>Portal module access</FormFieldLabel>
      <ListBox
        aria-label="Remote module access"
        bordered={false}
        readOnly
        selected={[]}
      >
        {values.map((module) => (
          <Option key={module} value={module}>
            {module}
          </Option>
        ))}
      </ListBox>
      <FormFieldHelperText>
        {record
          ? "Read-only for now. Module access is inherited from the user's groups."
          : "Save this user, then reopen it to view portal module access."}
      </FormFieldHelperText>
    </FormField>
  );
};
