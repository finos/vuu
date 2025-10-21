import { DataSource } from "@vuu-ui/vuu-data-types";
import { ChangeEventHandler, useCallback, useState } from "react";

export interface FreezeProps {
  dataSource: DataSource;
}

export const useFreezeControl = ({ dataSource }: FreezeProps) => {
  const [frozen, setFrozen] = useState(dataSource.isFrozen);

  const handleSwitchChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      const isFrozen = evt.target.checked;
      if (isFrozen) {
        dataSource.freeze?.();
      } else {
        dataSource.unfreeze?.();
      }
      setFrozen(isFrozen);
    },
    [dataSource],
  );

  return {
    frozen,
    onSwitchChange: handleSwitchChange,
  };
};
