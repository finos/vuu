import {
  AdminFormField,
  AdminLookupField,
  type AdminFieldsProps,
} from "../../components/AdminFormField";

export const GroupForm = (props: AdminFieldsProps) => (
  <>
    <AdminFormField {...props} field="group_name" label="Group name" required />
    <AdminFormField {...props} field="group_path" label="Group path" />
    <AdminLookupField
      {...props}
      field="parent_group_id"
      label="Parent group"
      table="groups"
      idField="group_id"
      labelField="group_name"
    />
    {props.relationships}
  </>
);
