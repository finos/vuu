import { toPlainObject } from "css-tree";

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
    return `[${this.#name}${this.#matcher}"${this.#value}"]`;
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

export type CssSelectorFragment =
  | AttributeSelector
  | ClassSelector
  | TypeSelector
  | PseudoElementSelector
  | PseudoClassSelector;
