import { VuuTimePicker } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler } from "@vuu-ui/vuu-utils";
import { useCallback } from "react";

const TimePickerTemplate = () => {
  const handleCommit = useCallback<CommitHandler<HTMLElement>>((e, value) => {
    console.log(`onCommit ${value}`);
  }, []);

  return <VuuTimePicker onCommit={handleCommit} />;
};

export const DefaultTimePicker = () => <TimePickerTemplate />;
