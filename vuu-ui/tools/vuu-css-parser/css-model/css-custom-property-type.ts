export type CssThemeVariableType = "characteristic" | "palette" | "foundation";
export type CssComponentVariableType = "component-api" | "component-local";

export type CssCustomPropertyType =
  | CssThemeVariableType
  | CssComponentVariableType;

// TOD we can deduce these by parsing file names from theme
const characteristics = new Set([
  "accent",
  "actionable",
  "container",
  "content",
  "draggable",
  "editable",
  "focused",
  "navigable",
  "overlayable",
  "selectable",
  "separable",
  "status",
  "target",
  "text",
  "track",
]);
const foundations = new Set([
  "animation",
  "color",
  "duration",
  "fade",
  "opacity",
  "shadow",
  "size",
  "spacing",
  "typography",
  "zindex",
]);

export const getCustomPropertyType = (
  propertyName: string
): CssCustomPropertyType => {
  const [, identifier, ...rest] = propertyName.slice(2).split("-");
  if (characteristics.has(identifier)) {
    return "characteristic";
  } else if (identifier === "palette") {
    return "palette";
  } else if (foundations.has(identifier)) {
    return "foundation";
  } else {
    return "component-local";
  }
};
