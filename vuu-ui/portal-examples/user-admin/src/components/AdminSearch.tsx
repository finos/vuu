import { FormField, FormFieldHelperText, FormFieldLabel } from "@salt-ds/core";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";

export const AdminSearch = ({
  label,
  onSearch,
}: {
  label: string;
  onSearch: (value: string) => void;
}) => (
  <FormField className="vuuIdentityAdmin-search">
    <FormFieldLabel>{label}</FormFieldLabel>
    <VuuInput
      commitOnBlur={false}
      commitWhenCleared={false}
      onCommit={(_, value) => onSearch(String(value).trim())}
      placeholder="Type a search and press Enter"
    />
    <FormFieldHelperText>
      Press Enter to search. Clear and press Enter to reset.
    </FormFieldHelperText>
  </FormField>
);
