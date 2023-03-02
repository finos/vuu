import { toPlainObject } from "css-tree";

export const isSelectorList = (cssTreeNode) =>
  cssTreeNode.type === "SelectorList";

export const isCustomProperty = (cssTreeNode) =>
  cssTreeNode.type === "Declaration" && cssTreeNode.property.startsWith("--");

export const isRGB = (cssTreeNode) =>
  cssTreeNode.type === "Function" &&
  (cssTreeNode.name === "rgb" || cssTreeNode.name === "rgba");

export const isVar = (cssTreeNode) =>
  cssTreeNode.type === "Function" && cssTreeNode.name === "var";

export class SelectorList {
  constructor(selectors) {
    this.selectors = selectors;
  }

  toString() {
    return this.selectors.map((sel) => sel.toString()).join(", ");
  }

  static from(cssTreeSelectorList) {
    const { children } = toPlainObject(cssTreeSelectorList);
    const selectors = children.map(parseSelector);
    return new SelectorList(selectors);
  }
}
export class Selector {
  constructor(selectors) {
    this.selectors = selectors;
  }

  toString() {
    return this.selectors.map((sel) => sel.toString()).join("");
  }

  static from(cssTreeSelector) {
    const json = toPlainObject(cssTreeSelector);
    const { children } = json;
    const selectors = children.map(parseSelector);
    return new Selector(selectors);
  }
}
class BaseSelector {
  name;
  constructor(name) {
    this.name = name;
  }
}

export class AttributeSelector {
  #matcher;
  #name;
  #value;
  constructor(name, matcher, value) {
    this.#name = name;
    this.#matcher = matcher || "";
    this.#value = value || "";
  }

  toString() {
    return `[${this.#name}${this.#matcher}${this.#value}]`;
  }

  static from(cssTreeSelector) {
    const json = toPlainObject(cssTreeSelector);
    const { matcher, name, value } = json;
    return new AttributeSelector(name.name, matcher, value?.name);
  }
}

export class ClassSelector extends BaseSelector {
  toString() {
    return `.${this.name}`;
  }
}
export class TypeSelector extends BaseSelector {
  toString() {
    return `${this.name}`;
  }
}
export class PseudoElementSelector extends BaseSelector {
  toString() {
    return `::${this.name}`;
  }
}
export class PseudoClassSelector extends BaseSelector {
  toString() {
    return `::${this.name}`;
  }
}

export class CustomProperty {
  name;
  #value;

  constructor(name, value) {
    this.name = name;
    this.#value = value;
  }

  get references() {
    if (this.#value instanceof Var) {
      return this.#value.name;
    } else {
      return null;
    }
  }

  toString() {
    if (Array.isArray(this.#value)) {
      return `${this.name} = ${this.#value.map((v) => v.toString()).join(" ")}`;
    } else {
      return `${this.name} = ${this.#value.toString()}`;
    }
  }

  static from(cssTreeNode) {
    const json = toPlainObject(cssTreeNode);
    const { property, value } = json;
    return new CustomProperty(property, parseVariableValue(value));
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
    }
  }
}

export class Var {
  name;
  #fallback;

  constructor(name, fallback) {
    this.name = name;
    this.#fallback = fallback;
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
        const values = fallback.filter((v) => v.value !== ",");
        if (values.length === 1) {
          return new Var(name, parseVariableValue(values[0]));
        }
      }
    }
  }
}
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

export class Identifier {
  #name;
  constructor(name) {
    this.#name = name;
  }
  toString() {
    return this.#name;
  }
}
export class CssNumber {
  #value;
  constructor(value) {
    this.#value = parseFloat(value);
  }
  toString() {
    return this.#value;
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

export class Url {
  #value;
  constructor(value) {
    this.#value = value;
  }
  toString() {
    return `url(${this.#value})`;
  }
}

function parseSelector(cssTreeSelectorNode) {
  // prettier-ignore
  switch (cssTreeSelectorNode.type) {
    case "AttributeSelector": return AttributeSelector.from(cssTreeSelectorNode)
    case "ClassSelector": return new ClassSelector(cssTreeSelectorNode.name)
    case "PseudoClassSelector": return new PseudoClassSelector(cssTreeSelectorNode.name)
    case "PseudoElementSelector": return new PseudoElementSelector(cssTreeSelectorNode.name)
    case "Selector": return Selector.from(cssTreeSelectorNode)
    case "TypeSelector": return new TypeSelector(cssTreeSelectorNode.name)
    default:
      console.log(`unknown selector ${cssTreeSelectorNode.type} ${JSON.stringify(cssTreeSelectorNode)}`);
  }
  return "";
}

function parseVariableValue(cssTreeValueNode) {
  const { children } = cssTreeValueNode;
  if (children.length === 1) {
    return parseValue(children[0]);
  } else {
    return children.map(parseValue);
  }
}

function parseValue(cssTreeValueNode) {
  // prettier-ignore
  switch (cssTreeValueNode.type) {
      case "Number": return new CssNumber(cssTreeValueNode.value);
      case "Percentage": return new Percentage(cssTreeValueNode.value);
      case "Dimension": return new Dimension(cssTreeValueNode.value, cssTreeValueNode.unit);
      case "Identifier": return new Identifier(cssTreeValueNode.name);
      case "Function": return parseFunction(cssTreeValueNode);
      case "Operator": return cssTreeValueNode.value;
      case "Parentheses": return ParenthesizedExpression.from(cssTreeValueNode);
      case "Url": return new Url(cssTreeValueNode.value); 
      default:
        console.log(`unknown value type ${cssTreeValueNode.type} ${JSON.stringify(cssTreeValueNode)}`)
  }
  return "";
}

function parseFunction(cssTreeFunctionNode) {
  // prettier-ignore
  switch (cssTreeFunctionNode.name) {
    case "calc": return Calc.from(cssTreeFunctionNode)
    case "rgb": 
    case "rgba": return Color.from(cssTreeFunctionNode)
    case "var": return Var.from(cssTreeFunctionNode);
    default:
      console.log(`unknown function ${cssTreeFunctionNode.name}`);
  }
  return "";
}
