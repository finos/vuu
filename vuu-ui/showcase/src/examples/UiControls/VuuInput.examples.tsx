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

export const VuuInputWithErrorMessage = () => {
  return <VuuInputTemplate errorMessage="Help" />;
};
VuuInputWithErrorMessage.displaySequence = displaySequence++;

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
  const errorMessage = getTooltipContent("number", valid);
  const handleCommit = useCallback<
    CommitHandler<HTMLInputElement, string | undefined>
  >((evt) => {
    const fieldElement = evt.target as HTMLInputElement;
    const fieldValue = fieldElement?.value;
    setInputValue(fieldValue);
  }, []);

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
        onCommit={handleCommit}
        data-testid="vuu-input"
        errorMessage={errorMessage}
      />
    </div>
  );
};
VuuInputWithValidation.displaySequence = displaySequence++;
