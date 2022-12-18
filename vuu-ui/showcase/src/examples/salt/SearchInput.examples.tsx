import React from "react";
import { FormField, SearchInput } from "@salt-ds/lab";

export const DefaultSearch = () => {
  return <SearchInput defaultValue="Value" />;
};

export const WithFormField = () => {
  return (
    <FormField label="ADA compliant label" style={{ width: 292 }}>
      <SearchInput defaultValue="Value" />
    </FormField>
  );
};
