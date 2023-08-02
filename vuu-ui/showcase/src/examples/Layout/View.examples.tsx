import { Component, View } from "@finos/vuu-layout";

let displaySequence = 1;

export const ComponentWithBorderAndHeader = ({ width = 500, height = 400 }) => (
  <View
    title="Tye Boss"
    header
    style={{
      width,
      height,
      padding: 20,
      border: "5px solid black",
      backgroundColor: "yellow",
    }}
  >
    <Component />
  </View>
);
ComponentWithBorderAndHeader.displaySequence = displaySequence++;
