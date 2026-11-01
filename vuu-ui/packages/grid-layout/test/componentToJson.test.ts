import React from "react";
import { describe, expect, it } from "vitest";
import { componentToJson } from "../src/componentToJson";
import { layoutFromJson } from "../src/layoutFromJson";

describe("component serialization", () => {
  it("round trips primitive React children", () => {
    const component = React.createElement(
      "div",
      { id: "palette-component" },
      "Coral template",
      7,
    );

    const json = componentToJson(component);
    expect(json.children).toEqual(["Coral template", 7]);

    const restored = layoutFromJson(json);
    expect(React.Children.toArray(restored.props.children)).toEqual([
      "Coral template",
      7,
    ]);
  });

  it("restores legacy children stored in props", () => {
    const restored = layoutFromJson({
      props: { children: "Legacy template" },
      type: "div",
    });

    expect(restored.props.children).toBe("Legacy template");
  });

  it("preserves legacy children when top-level children are empty", () => {
    const restored = layoutFromJson({
      children: [],
      props: { children: "Legacy template" },
      type: "div",
    });

    expect(restored.props.children).toBe("Legacy template");
  });
});
