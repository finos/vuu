import { toPlainObject } from "css-tree";
import { parseValue, parseVariableValue } from "./css-parse-model";
import { isRGB, isVar } from "./css-parse-model-utils";
import {
  CssCustomPropertyType,
  getCustomPropertyType,
} from "./css-custom-property-type";

export class Calc {
  #expression;

  constructor(expression) {
    this.#expression = expression;
  }

  toString() {
    return `calc(${this.#expression.toString()})`;
  }

  static from(cssTreeNode) {
    return new Calc(ParenthesizedExpression.from(cssTreeNode));
  }
}

export class Color {
  #format = "rgb";
  #opacity = 1;
  #value;

  constructor(r, g, b, a) {
    this.#value = [r, g, b];
    this.#opacity = typeof a === "number" ? a : 1;
  }

  toString() {
    return this.#opacity === 1
      ? `rgb(${this.#value.join(",")})`
      : `rgba(${this.#value.join(",")},${this.#opacity})`;
  }

  static from(cssTreeNode) {
    if (isRGB(cssTreeNode)) {
      const [r, g, b, a] = cssTreeNode.children
        .filter((c) => c.type === "Number")
        .map((c) => parseFloat(c.value));

      return new Color(r, g, b, a);
    } else {
      throw Error(`unrecognised color format ${JSON.stringify(cssTreeNode)}`);
    }
  }
}

export class CssNumber {
  #value: number;
  constructor(value) {
    this.#value = parseFloat(value);
  }
  toString() {
    return this.#value.toString();
  }
}

export class CssString {
  #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  toString() {
    return `"${this.#value}"`;
  }
}

export class Dimension {
  #unit;
  #value;
  constructor(value, unit) {
    this.#value = parseFloat(value);
    this.#unit = unit;
  }
  toString() {
    return `${this.#value}${this.#unit}`;
  }
}

export class Identifier {
  #name;
  constructor(name) {
    this.#name = name;
  }
  toString() {
    return this.#name;
  }
}

export class ParenthesizedExpression {
  #expressionElements;

  constructor(expressionElements) {
    this.#expressionElements = expressionElements;
  }

  toString() {
    return `(${this.#expressionElements
      .map((expr) => expr.toString())
      .join(" ")})`;
  }

  static from(cssTreeNode) {
    const json = toPlainObject(cssTreeNode);
    const expressionElements = json.children.map(parseValue);
    return new ParenthesizedExpression(expressionElements);
  }
}

export class Percentage {
  #value;
  constructor(value) {
    this.#value = parseFloat(value);
  }
  toString() {
    return `${this.#value}%`;
  }
}

export class Url {
  #value;
  constructor(value) {
    this.#value = value;
  }
  toString() {
    return `url(${this.#value})`;
  }
}

export class Var {
  name: string;
  #fallback?: CustomVariableValue | CustomVariableValue[];

  constructor(
    name: string,
    fallback?: CustomVariableValue | CustomVariableValue[]
  ) {
    this.name = name;
    this.#fallback = fallback;
  }

  get fallback() {
    return this.#fallback;
  }

  toString() {
    return this.#fallback
      ? `var(${this.name},${this.#fallback.toString()})`
      : `var(${this.name})`;
  }

  static from(cssTreeNode) {
    if (isVar(cssTreeNode)) {
      const json = toPlainObject(cssTreeNode);
      const [{ name }, ...fallback] = json.children;
      if (fallback.length === 0) {
        return new Var(name);
      } else {
        // first entity is always the comma operator
        const fallbackValue = fallback[1];
        console.log(JSON.stringify(fallbackValue));
        return new Var(name, parseVariableValue(fallbackValue));
      }
    }
  }
}

export type CssFunction = Calc | Color | Var;
export type CustomVariableValue =
  | CssFunction
  | CssNumber
  | CssString
  | Dimension
  | Identifier
  | ParenthesizedExpression
  | Percentage
  | Url
  | Var;

export class CustomProperty {
  name: string;
  #value: CustomVariableValue;
  #type: CssCustomPropertyType;

  constructor(name: string, value: CustomVariableValue) {
    this.name = name;
    this.#value = value;
    this.#type = getCustomPropertyType(name);
  }

  get value() {
    return this.#value;
  }

  get references() {
    if (this.#value instanceof Var) {
      return this.#value.name;
    } else {
      return null;
    }
  }

  toJSON() {
    return {
      name: this.name,
      value: this.#value,
    };
  }

  toString() {
    if (Array.isArray(this.#value)) {
      return `${this.name}: ${this.#value.map((v) => v.toString()).join(" ")};`;
    } else {
      return `${this.name}: ${this.#value.toString()};`;
    }
  }

  static from(cssTreeNode) {
    const json = toPlainObject(cssTreeNode);
    const { property, value } = json;
    return new CustomProperty(property, parseVariableValue(value));
  }
}
