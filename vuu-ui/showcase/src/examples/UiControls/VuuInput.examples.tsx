import { VuuInput, VuuInputProps } from "@finos/vuu-ui-controls";
import { CSSProperties } from "react";

let displaySequence = 1;

const VuuInputTemplate = ({
  position = { left: 0, top: 0 },
  ...props
}: Partial<VuuInputProps> & {
  position?: CSSProperties;
}) => {
  const TooltipProps = {
    tooltipContent: "something bad has happened"
  }
  return (
    <div
      style={{
        ...position,
        alignItems: "center",
        display: "flex",
        height: 50,
        padding: "var(--salt-spacing-100)",
        position: "absolute",
        width: 200,
      }}
    >
      <VuuInput
        TooltipProps={TooltipProps}
        data-testid="vuu-input"
        onCommit={() => console.log("commit")}
        {...props}
      />
    </div>
  );
};

export const DefaultVuuInput = () => {
  return <VuuInputTemplate />;
};
DefaultVuuInput.displaySequence = displaySequence++;

export const VuuInputWithErrorMessageTooltipRight = () => {
  return <VuuInputTemplate />;
};
VuuInputWithErrorMessageTooltipRight.displaySequence = displaySequence++;

export const VuuInputWithErrorMessageTooltipLeft = () => {

  return (
    <VuuInputTemplate
      position={{ left: 300, top: 0 }}
    />
  );
};
VuuInputWithErrorMessageTooltipLeft.displaySequence = displaySequence++;

export const InputRightTooltipLeftErrorMessage = () => {
  return (
    <VuuInputTemplate
      position={{ right: 0, top: 0 }}
    />
  );
};
InputRightTooltipLeftErrorMessage.displaySequence = displaySequence++;