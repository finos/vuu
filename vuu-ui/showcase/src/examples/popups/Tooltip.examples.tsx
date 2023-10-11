import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from "react";
import { Tooltip, useTooltip } from "@finos/vuu-popups";

import "./Tooltip.examples.css";

let displaySequence = 1;

type TooltipPlacement = "above" | "right" | "below" | "left";

export const DefaultTooltip = () => {
  const anchorRef = useRef(null);
  const [tooltipPlacement, setTooltipPlacement] =
    useState<TooltipPlacement>("right");
  const [tooltipContent, setTooltipContent] = useState<"child" | "text">(
    "text"
  );

  const handleChangePlacement = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      setTooltipPlacement(value as TooltipPlacement);
    },
    []
  );

  const handleChangeContent = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const { value } = evt.target as HTMLButtonElement;
      setTooltipContent(value as "child" | "text");
    },
    []
  );

  const tooltipChild = useMemo(
    () => (
      <div
        style={{
          alignItems: "center",
          background: "cornflowerblue",
          display: "flex",
          height: 60,
          justifyContent: "center",
          width: 120,
        }}
      >
        Custom Content
      </div>
    ),
    []
  );

  const { anchorProps, tooltipProps } = useTooltip({
    placement: tooltipPlacement,
    tooltipContent:
      tooltipContent === "text" ? "This is my tooltip" : tooltipChild,
  });

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      <div className="column" />
      <div className="row" />

      <ToggleButtonGroup
        value={tooltipPlacement}
        onChange={handleChangePlacement}
      >
        <ToggleButton value="above">ABOVE</ToggleButton>
        <ToggleButton value="right">RIGHT</ToggleButton>
        <ToggleButton value="below">BELOW</ToggleButton>
        <ToggleButton value="left">LEFT</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup value={tooltipContent} onChange={handleChangeContent}>
        <ToggleButton value="text">Text content</ToggleButton>
        <ToggleButton value="child">Chid Component</ToggleButton>
      </ToggleButtonGroup>

      <div
        className="box"
        style={{
          alignItems: "center",
          background: "rgba(0,0,0,.05)",
          display: "flex",
          height: 200,
          justifyContent: "center",
          left: 200,
          position: "absolute",
          top: 200,
          width: 200,
        }}
      >
        <Button
          {...anchorProps}
          ref={anchorRef}
          style={{
            height: 30,
            width: 160,
          }}
        >
          anchor
        </Button>
        {tooltipProps ? <Tooltip {...tooltipProps} /> : null}
      </div>
    </div>
  );
};
DefaultTooltip.displaySequence = displaySequence++;
