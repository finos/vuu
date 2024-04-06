import { CustomProperty, CustomVariableValue, Var } from "./CssCustomProperty";

export class VariableEntry {
  values: Map<string, CustomVariableValue>;

  constructor(scope: string, variable: CustomProperty) {
    this.values = new Map();
    this.values.set(scope, variable.value);
  }

  addVariable(scope: string, value: CustomVariableValue) {
    if (this.values.get(scope) !== undefined) {
      console.warn(
        "a value has already been set for this variable in same scope"
      );
    } else {
      this.values.set(scope, value);
    }
  }
}

export class CssVariableRegistry {
  #variableMap: Map<string, VariableEntry> = new Map();

  register(scope: string, variable: CustomProperty) {
    const variableEntry = this.#variableMap.get(variable.name);
    if (variableEntry) {
      variableEntry.addVariable(scope, variable.value);
    } else {
      this.#variableMap.set(variable.name, new VariableEntry(scope, variable));
    }
  }

  storeReferences() {
    for (const [variableName, { values }] of this.#variableMap.entries()) {
      for (const [scope, value] of values.entries()) {
        if (value instanceof Var) {
          const referencedVariable = this.#variableMap.get(value.name);
          if (referencedVariable) {
            // console.log(`${variableName} references ${value.name} t`);
          } else {
            console.log(
              `${variableName} references ${value.name} but we have no record of it`
            );
          }
          if (value.fallback) {
            console.log("theres a fallback");
          }
          // process the reference
        }
      }
    }
  }

  get count() {
    return this.#variableMap.size;
  }
}
