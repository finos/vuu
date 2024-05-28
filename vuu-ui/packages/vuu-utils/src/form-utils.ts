/**
 * Use with the following convention:
 *
 * <FormField data-field="my-field-name">
 */
export const getFieldName = (
  input: HTMLInputElement | HTMLButtonElement
): string => {
  const saltFormField = input.closest(".saltFormField") as HTMLElement;
  if (saltFormField && saltFormField.dataset.field) {
    const {
      dataset: { field },
    } = saltFormField;
    return field;
  } else {
    throw Error("named form field not found");
  }
};
