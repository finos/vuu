import {
  AdminFormField,
  AdminLookupField,
  type AdminFieldsProps,
} from "../../components/AdminFormField";

export const RoleForm = (props: AdminFieldsProps) => (
  <>
    <AdminFormField {...props} field="role_name" label="Role name" required />
    <AdminLookupField
      {...props}
      disabled={props.disabled || props.editing === true}
      field="client_id"
      label="Client"
      table="clients"
      idField="client_id"
      labelField="client_name"
      required
    />
    <AdminFormField {...props} field="description" label="Description" />
  </>
);
