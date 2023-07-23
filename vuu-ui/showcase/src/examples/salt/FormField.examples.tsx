import { FormField, FormFieldProps, Input } from "@salt-ds/core";

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
