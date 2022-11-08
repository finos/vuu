import {
  FormField,
  FormFieldProps,
  Input
} from "@heswell/uitk-core";


export const Default = (props: FormFieldProps) => {
  return (
    <>
      <FormField label="Default Form Field label" {...props}>
        <Input defaultValue="Value" />
      </FormField>
      <div style={{ height: 40 }} />
      {/* <FormField
        labelPlacement="left"
        label="Default Form Field label"
        {...props}
      >
        <Input defaultValue="Value" />
      </FormField> */}
    </>
  );
};

