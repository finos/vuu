import { SidePanel } from "@salt-ds/core";
import { Instruments } from "./Modules/SIMUL.examples";

/** tags=data-consumer */
export const SimpleSidePanel = () => {
  return (
    <>
      <Instruments />
      <SidePanel open position="right">
        <div />
      </SidePanel>
    </>
  );
};
