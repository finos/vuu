import { VuuInput, VuuInputProps } from "@finos/vuu-ui-controls";
import { CommitHandler } from "@finos/vuu-utils";
import { CSSProperties, useCallback, useState } from "react";

let displaySequence = 1;

const VuuInputTemplate = ({
  position = { left: 0, top: 0 },
  ...props
}: Partial<VuuInputProps> & {
  position?: CSSProperties;
}) => {
  const TooltipProps = {
    tooltipContent: "something bad has happened",
  };
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
  return <VuuInputTemplate position={{ left: 300, top: 0 }} />;
};
VuuInputWithErrorMessageTooltipLeft.displaySequence = displaySequence++;

export const InputRightTooltipLeftErrorMessage = () => {
  return <VuuInputTemplate position={{ right: 0, top: 0 }} />;
};
InputRightTooltipLeftErrorMessage.displaySequence = displaySequence++;

// Showcase example showing the application of the VuuInput box with input validation
export const VuuInputWithValidation = () => {
  //Input validation
  const isValidInput = (value: unknown, type: unknown) => {
    if (value === "") {
      return undefined;
    }
    if (type === "string") {
      return "success";
    } else if (type === "number") {
      if (Number.isNaN(Number(value))) {
        return "error";
      }
      return "success";
    }
  };
  function getTooltipContent(type: string, valid: string | undefined) {
    if (valid === "error") {
      if (type === "number") {
        return <p>Field is expecting a number</p>;
      } else if (type === "string") {
        return <p>Field is expecting a string</p>;
      } else {
        return (
          <p>Please contact Admin for more information on expected type</p>
        );
      }
    } else {
      return undefined;
    }
  }
  const [inputValue, setInputValue] = useState("");
  const valid = isValidInput(inputValue, "number");
  const content = getTooltipContent("number", valid);
  const handleCommit = useCallback<
    CommitHandler<HTMLInputElement, string | undefined>
  >((evt) => {
    const fieldElement = evt.target as HTMLInputElement;
    const fieldValue = fieldElement?.value;
    setInputValue(fieldValue);
  }, []);
  const TooltipProps = {
    tooltipContent: content,
  };

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        height: 50,
        padding: "var(--salt-spacing-100)",
        position: "absolute",
        width: 200,
      }}
    >
      <VuuInput
        validationStatus={valid}
        onCommit={handleCommit}
        data-testid="vuu-input"
        TooltipProps={TooltipProps}
      />
    </div>
  );
};
VuuInputWithValidation.displaySequence = displaySequence++;
