import { Component, View } from "@vuu-ui/vuu-layout";

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
