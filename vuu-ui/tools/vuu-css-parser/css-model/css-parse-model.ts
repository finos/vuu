import { toPlainObject } from "css-tree";
import {
  Calc,
  Color,
  CssFunction,
  CssNumber,
  CssString,
  CustomProperty,
  CustomVariableValue,
  Dimension,
  Identifier,
  ParenthesizedExpression,
  Percentage,
  Url,
  Var,
} from "./CssCustomProperty";
import {
  AttributeSelector,
  ClassSelector,
  CssSelectorFragment,
  PseudoClassSelector,
  PseudoElementSelector,
  TypeSelector,
} from "./CssSelector";

export class SelectorList {
  #selectors: Selector[];
  constructor(selectors: Selector[]) {
    this.#selectors = selectors;
  }

  get selectors() {
    return this.#selectors;
  }

  toString() {
    return this.#selectors.map((sel) => sel.toString()).join(", ");
  }

  static from(cssTreeSelectorList) {
    const { children } = toPlainObject(cssTreeSelectorList);
    const selectors = children.map(Selector.from);
    return new SelectorList(selectors);
  }
}

export class Selector {
  selectors: CssSelectorFragment[];

  constructor(selectors: CssSelectorFragment[]) {
    this.selectors = selectors;
  }

  toString() {
    return this.selectors.map((sel) => sel.toString()).join("");
  }

  static from(cssTreeSelector) {
    const json = toPlainObject(cssTreeSelector);
    const { children } = json;
    const selectors = children
      .map(parseSelectorFragment)
      .filter((s) => s !== null);
    return new Selector(selectors);
  }
}

function parseSelectorFragment(
  cssTreeSelectorNode
): CssSelectorFragment | null {
  // prettier-ignore
  switch (cssTreeSelectorNode.type) {
    case "AttributeSelector": return AttributeSelector.from(cssTreeSelectorNode)
    case "ClassSelector": return new ClassSelector(cssTreeSelectorNode.name)
    case "PseudoClassSelector": return new PseudoClassSelector(cssTreeSelectorNode.name)
    case "PseudoElementSelector": return new PseudoElementSelector(cssTreeSelectorNode.name)
    case "TypeSelector": return new TypeSelector(cssTreeSelectorNode.name);
    case "Combinator": return null;
    default:
  }
  throw Error(
    `unknown selector ${cssTreeSelectorNode.type} ${JSON.stringify(
      cssTreeSelectorNode
    )}`
  );
}

export function parseValue(cssTreeValueNode): CustomVariableValue {
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
      case "String": return new CssString(cssTreeValueNode.value);
      default:
        console.log(`unknown value type ${cssTreeValueNode.type} ${JSON.stringify(cssTreeValueNode)}`)
  }
  throw Error(`unable to parse value ${JSON.stringify(cssTreeValueNode)}`);
}

export function parseVariableValue(
  cssTreeValueNode
): CustomVariableValue | CustomVariableValue[] {
  const { children } = cssTreeValueNode;
  if (children.length === 1) {
    return parseValue(children[0]);
  } else {
    return children.map(parseValue);
  }
}

function parseFunction(cssTreeFunctionNode): CssFunction {
  // prettier-ignore
  switch (cssTreeFunctionNode.name) {
    case "calc": return Calc.from(cssTreeFunctionNode)
    case "rgb": 
    case "rgba": return Color.from(cssTreeFunctionNode)
    case "var": return Var.from(cssTreeFunctionNode);
    default:
      throw Error(`unknown function ${cssTreeFunctionNode.name}`);
  }
}

export class Scope {
  #selector: string;
  #variables: CustomProperty[] = [];

  constructor(selector) {
    this.#selector = selector;
  }

  get selector() {
    return this.#selector;
  }

  addCustomProperty(customProperty: CustomProperty) {
    this.#variables.push(customProperty);
  }

  toString() {
    return `${this.#selector}\n\t${this.#variables
      .map((v) => v.toString())
      .join("\n\t")}`;
  }
}

export class ScopeList {
  #scopes: Scope[] = [];
  addScope(scope: Scope) {
    this.#scopes.push(scope);
    return scope;
  }

  get scopes() {
    console.log(`return ${this.#scopes.length} scopes`);
    return this.#scopes;
  }

  getOrCreate(selector: string) {
    const scope = this.#scopes.find((scope) => scope.selector === selector);
    if (scope) {
      return scope;
    } else {
      return this.addScope(new Scope(selector));
    }
  }
}
