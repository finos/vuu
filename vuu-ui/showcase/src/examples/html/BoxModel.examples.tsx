import { Flexbox, View } from "@finos/vuu-layout";
import { Toolbar } from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";
import { CSSProperties, HTMLAttributes, useCallback, useState } from "react";
import { Box } from "./Box";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size: "large" | "small";
}
type ContainerType =
  | "sized"
  | "unsized"
  | "flex-row-stretch"
  | "flex-col-stretch";

let displaySequence = 1;

const UnSizedContainer = ({ children }: ContainerProps) => (
  <div>{children}</div>
);
const SizedContainer = ({ children, size }: ContainerProps) => (
  <div
    style={{
      width: size === "large" ? 700 : 400,
      height: size === "large" ? 600 : 300,
    }}
  >
    {children}
  </div>
);
const FlexRowStretchContainer = ({ children, size }: ContainerProps) => (
  <div
    style={{
      display: "flex",
      width: size === "large" ? 700 : 400,
      height: size === "large" ? 600 : 300,
    }}
  >
    <div style={{ background: "green", flexShrink: 0, width: 100 }} />
    {children}
    <div style={{ background: "green", flexShrink: 0, width: 100 }} />
  </div>
);

const FlexColStretchContainer = ({ children, size }: ContainerProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      width: size === "large" ? 700 : 400,
      height: size === "large" ? 600 : 300,
    }}
  >
    {children}
    <div style={{ background: "green", flexShrink: 0, height: 100 }} />
  </div>
);

const getContainer = (type: ContainerType) => {
  // prettier-ignore
  switch(type){
    case "sized": return SizedContainer;
    case "flex-row-stretch": return FlexRowStretchContainer;
    case "flex-col-stretch": return FlexColStretchContainer;
    default:return UnSizedContainer;
  }
};

export const AdventuresOfA100PercentBox = () => {
  const [containerSize, setContainerSize] = useState<"large" | "small">(
    "large"
  );
  const [target, setTarget] = useState<ContainerType>("sized");
  const Container = getContainer(target);

  const toggleSize = useCallback(() => {
    setContainerSize((currentSize) =>
      currentSize === "small" ? "large" : "small"
    );
  }, []);

  return (
    <>
      <Toolbar
        style={{ "--saltToolbar-alignItems": "center" } as CSSProperties}
      >
        <Button onClick={() => setTarget("sized")}>Sized Container</Button>
        <Button onClick={() => setTarget("unsized")}>Unsized Container</Button>
        <Button onClick={() => setTarget("flex-row-stretch")}>
          Flex Row Stretch
        </Button>
        <Button onClick={() => setTarget("flex-col-stretch")}>
          Flex Col Stretch
        </Button>
        <Button onClick={() => toggleSize()} disabled={target === "unsized"}>
          {containerSize === "small" ? "Make Larger" : "Make Smaller"}
        </Button>
      </Toolbar>
      <Container size={containerSize}>
        <Box />
      </Container>
    </>
  );
};
AdventuresOfA100PercentBox.displaySequence = displaySequence++;

export const BoxInAFlexBox = () => {
  return (
    <Flexbox style={{ flexDirection: "column", width: 800, height: 700 }}>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <Box />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Box />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <Box />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Box />
        </View>
      </Flexbox>
    </Flexbox>
  );
};
BoxInAFlexBox.displaySequence = displaySequence++;

export const FixedSizeBox = () => {
  return <Box height={100} width={200} />;
};
FixedSizeBox.displaySequence = displaySequence++;
