import { FormField, FormFieldProps, Input } from "@heswell/salt-lab";

export const Default = (props: FormFieldProps) => {
  return (
    <>
      <FormField label="Default Form Field label" {...props}>
        <Input defaultValue="Value" />
      </FormField>
      <div style={{ height: 40 }} />
    </>
  );
};
