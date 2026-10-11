/**
 * Editable example props. An example declares the props it supports, the
 * showcase renders a control for each one in the Props panel:
 *
 *   const testTableProps = defineExampleProps({
 *     rowCount: { type: "number", default: 1000, min: 0 },
 *     columnLayout: { type: "select", options: ["static", "fit"] },
 *     onSelect: { type: "action" },
 *   });
 *
 *   export const TestTable = ({
 *     rowCount = 1000,
 *   }: ExampleProps<typeof testTableProps>) => …
 *   TestTable.props = testTableProps;
 *
 * Only values changed from their default are passed to the example, so the
 * example's own default values apply otherwise.
 */

interface PropDefBase {
  description?: string;
}

export interface BooleanPropDef extends PropDefBase {
  type: "boolean";
  default?: boolean;
}
export interface NumberPropDef extends PropDefBase {
  type: "number";
  default?: number;
  max?: number;
  min?: number;
  step?: number;
}
export interface StringPropDef extends PropDefBase {
  type: "string";
  default?: string;
}
export interface SelectPropDef extends PropDefBase {
  type: "select";
  default?: string;
  options: readonly string[];
}
export interface MultiSelectPropDef extends PropDefBase {
  type: "multiselect";
  default?: readonly string[];
  options: readonly string[];
}
/** A callback prop, invocations are shown in the actions log */
export interface ActionPropDef extends PropDefBase {
  type: "action";
}

export type ExamplePropDef =
  | ActionPropDef
  | BooleanPropDef
  | MultiSelectPropDef
  | NumberPropDef
  | SelectPropDef
  | StringPropDef;

export type ExamplePropDefs = { [name: string]: ExamplePropDef };

type PropValue<D extends ExamplePropDef> = D extends BooleanPropDef
  ? boolean
  : D extends NumberPropDef
    ? number
    : D extends StringPropDef
      ? string
      : D extends { type: "select"; options: readonly (infer O)[] }
        ? O
        : D extends { type: "multiselect"; options: readonly (infer O)[] }
          ? O[]
          : // biome-ignore lint/suspicious/noExplicitAny: callback args are example specific
            (...args: any[]) => void;

/** The props type of an example, derived from its declaration */
export type ExampleProps<D extends ExamplePropDefs> = {
  [K in keyof D]?: PropValue<D[K]>;
};

/** Identity, preserves the literal types of options */
export const defineExampleProps = <const D extends ExamplePropDefs>(defs: D) =>
  defs;

export type ExamplePropValue = boolean | number | string | string[];
export type ExamplePropValues = { [name: string]: ExamplePropValue };

const PROP_TYPES = new Set([
  "action",
  "boolean",
  "multiselect",
  "number",
  "select",
  "string",
]);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isPropDef = (value: unknown): value is ExamplePropDef => {
  if (!value || typeof value !== "object") return false;
  const { options, type } = value as { options?: unknown; type?: unknown };
  return (
    typeof type === "string" &&
    PROP_TYPES.has(type) &&
    ((type !== "select" && type !== "multiselect") || isStringArray(options))
  );
};

/** The valid prop definitions within an untrusted value, if any */
export const getExamplePropDefs = (
  value: unknown,
): ExamplePropDefs | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const defs: ExamplePropDefs = {};
  for (const [name, def] of Object.entries(value)) {
    if (isPropDef(def)) {
      defs[name] = def;
    }
  }
  return Object.keys(defs).length > 0 ? defs : undefined;
};

const isValidValue = (def: ExamplePropDef, value: unknown) => {
  switch (def.type) {
    case "boolean":
      return typeof value === "boolean";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string";
    case "select":
      return typeof value === "string" && def.options.includes(value);
    case "multiselect":
      return (
        isStringArray(value) &&
        value.every((item) => def.options.includes(item))
      );
    default:
      return false;
  }
};

/** Values valid for the given definitions, others are dropped */
export const sanitiseExampleProps = (
  defs: ExamplePropDefs,
  values: Record<string, unknown>,
): ExamplePropValues => {
  const result: ExamplePropValues = {};
  for (const [name, value] of Object.entries(values)) {
    const def = defs[name];
    if (def && isValidValue(def, value)) {
      result[name] = value as ExamplePropValue;
    }
  }
  return result;
};

/** The value shown by a control, the set value or the declared default */
export const effectivePropValue = (
  def: ExamplePropDef,
  value: ExamplePropValue | undefined,
): ExamplePropValue | undefined => {
  if (value !== undefined) return value;
  if (def.type === "multiselect") return def.default ? [...def.default] : [];
  return def.type === "action" ? undefined : def.default;
};

const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((item, i) => item === b[i])
    : a === b;

/** Values with a value equal to the declared default removed */
export const withoutDefaults = (
  defs: ExamplePropDefs,
  values: ExamplePropValues,
): ExamplePropValues => {
  const result: ExamplePropValues = {};
  for (const [name, value] of Object.entries(values)) {
    const def = defs[name];
    const fallback = def ? effectivePropValue(def, undefined) : undefined;
    if (!sameValue(value, fallback)) {
      result[name] = value;
    }
  }
  return result;
};

// url safe base64 of utf8 JSON, without padding, so it can be carried in a
// url param or the url hash
export const encodeExampleProps = (values: ExamplePropValues) => {
  if (Object.keys(values).length === 0) return "";
  const bytes = new TextEncoder().encode(JSON.stringify(values));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decodeExampleProps = (
  encoded: string | null | undefined,
): Record<string, unknown> => {
  if (!encoded) return {};
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
};

const jsxValue = (value: ExamplePropValue) =>
  typeof value === "string"
    ? JSON.stringify(value)
    : `{${JSON.stringify(value)}}`;

/** JSX for the example, with the given (non default) values */
export const exampleToJsx = (
  componentName: string,
  values: ExamplePropValues,
) => {
  const attributes = Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) =>
      value === true ? name : `${name}=${jsxValue(value)}`,
    );
  if (attributes.length === 0) return `<${componentName} />`;
  const inline = `<${componentName} ${attributes.join(" ")} />`;
  return inline.length <= 80
    ? inline
    : `<${componentName}\n${attributes.map((a) => `  ${a}`).join("\n")}\n/>`;
};

/** Summary of callback arguments, which may not be serialisable */
export const describeActionArgs = (args: unknown[]) =>
  args
    .map((arg) => {
      if (arg === undefined) return "undefined";
      if (typeof arg === "function") return "ƒ";
      if (typeof arg === "object" && arg !== null) {
        if ("nativeEvent" in arg || arg instanceof Event) {
          return `${(arg as { type?: string }).type ?? "event"} event`;
        }
        if (typeof Node !== "undefined" && arg instanceof Node) {
          return `<${arg.nodeName.toLowerCase()}>`;
        }
      }
      try {
        const json = JSON.stringify(arg);
        return json.length > 120 ? `${json.slice(0, 117)}…` : json;
      } catch {
        return String(arg);
      }
    })
    .join(", ");

/** messages between the showcase and an example (in its iframe) */
export const EXAMPLE_PROPS_MESSAGE = "vuu-showcase:example-props";
export const EXAMPLE_ACTION_MESSAGE = "vuu-showcase:example-action";

export interface ExamplePropsMessage {
  type: typeof EXAMPLE_PROPS_MESSAGE;
  defs: ExamplePropDefs;
}
export interface ExampleActionMessage {
  type: typeof EXAMPLE_ACTION_MESSAGE;
  args: string;
  name: string;
}

/** Name of the url param (showcase) and hash param (iframe) for prop values */
export const PROPS_PARAM = "props";
