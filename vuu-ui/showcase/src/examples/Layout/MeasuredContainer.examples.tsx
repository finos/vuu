import { MeasuredContainer } from "@finos/vuu-ui-controls";
import { isValidNumber } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";

import "./MeasuredContainer.examples.css";

let displaySequence = 1;

const MeasuredChild = () => {
  const [{ h, w }, setSize] = useState<{ h: number; w: number }>({
    h: 0,
    w: 0,
  });
  const resizeObserver = useMemo(() => {
    let currentHeight = 0;
    let currentWidth = 0;
    return new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect;
        if (
          isValidNumber(height) &&
          (currentHeight !== height || currentWidth !== width)
        ) {
          currentHeight = height;
          currentWidth = width;
          setSize({ h: height, w: width });
        }
      }
    });
  }, []);

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        resizeObserver.observe(el);
      }
    },
    [resizeObserver]
  );

  return (
    <div className="vuuMeasuredChildExample" ref={ref}>
      <span>{w}</span>
      <span>*</span>
      <span>{h}</span>
    </div>
  );
};

export const DefaultMeasuredContainer = () => {
  return (
    <MeasuredContainer>
      <MeasuredChild />
    </MeasuredContainer>
  );
};
DefaultMeasuredContainer.displaySequence = displaySequence++;

export const FixedSizeMeasuredContainer = () => {
  return (
    <MeasuredContainer height={300} width={600}>
      <MeasuredChild />
    </MeasuredContainer>
  );
};
FixedSizeMeasuredContainer.displaySequence = displaySequence++;

export const FixedHeightMeasuredContainer = () => {
  return (
    <MeasuredContainer height={300}>
      <MeasuredChild />
    </MeasuredContainer>
  );
};
FixedHeightMeasuredContainer.displaySequence = displaySequence++;

export const PercentageSizeMeasuredContainer = () => {
  return (
    <MeasuredContainer height="50%" width="50%">
      <MeasuredChild />
    </MeasuredContainer>
  );
};
PercentageSizeMeasuredContainer.displaySequence = displaySequence++;

export const FlexLayoutMeasuredContainer = () => {
  return (
    <div
      style={{
        border: "solid 1px black",
        display: "flex",
        flexDirection: "column",
        height: 602,
        width: 402,
      }}
    >
      <div style={{ flex: "0 0 50px", background: "red" }} />
      <div style={{ flex: "1 1 0" }}>
        <MeasuredContainer>
          <MeasuredChild />
        </MeasuredContainer>
      </div>
      <div style={{ flex: "0 0 50px", background: "green" }} />
    </div>
  );
};
FlexLayoutMeasuredContainer.displaySequence = displaySequence++;
