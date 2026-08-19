import {
  AdminFormField,
  type AdminFieldsProps,
} from "../../components/AdminFormField";

export const UserForm = (props: AdminFieldsProps) => (
  <>
    <AdminFormField {...props} field="username" label="Username" required />
    <AdminFormField {...props} field="email" label="Email" type="email" />
    <AdminFormField {...props} field="first_name" label="First name" />
    <AdminFormField {...props} field="last_name" label="Last name" />
    <AdminFormField
      {...props}
      field="enabled"
      label="Enabled"
      type="checkbox"
    />
    <AdminFormField
      {...props}
      field="temporary_password"
      label="Temporary password"
      type="password"
    />
    {props.relationships}
  </>
);
