import { LoginPanel } from "@finos/vuu-shell";

let displaySequence = 1;

export const DefaultLoginPanel = () => {
  return <LoginPanel onSubmit={() => console.log("onSubmit")} />;
};
DefaultLoginPanel.displaySequence = displaySequence++;
