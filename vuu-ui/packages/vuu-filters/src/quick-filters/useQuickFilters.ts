import { ChangeEventHandler, useCallback } from "react";

export const useQuickFilters = () => {
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      console.log(`onChange ${e.target.value}`);
    },
    []
  );

  return {
    onChange: handleChange,
  };
};
