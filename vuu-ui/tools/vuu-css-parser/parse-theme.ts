import { parse, walk } from "css-tree";
import { CustomProperty } from "./css-model/CssCustomProperty.ts";
import { CssVariableRegistry } from "./css-model/CssVariableRegistry.ts";
import { isCustomProperty } from "./css-model/css-parse-model-utils.ts";
import { Scope, ScopeList, SelectorList } from "./css-model/css-parse-model.ts";

export const parseTheme = (cssString) => {
  console.time("parse");
  const ast = parse(cssString, {
    parseCustomProperty: true,
  });
  console.timeEnd("parse");

  let currentSelectorList;
  const scopeList = new ScopeList();
  const variableRegistry = new CssVariableRegistry();
  const currentScopes: Scope[] = [];

  walk(ast, {
    enter: (node) => {
      switch (node.type) {
        case "SelectorList": {
          currentSelectorList = SelectorList.from(node);
          currentScopes.length = 0;
          currentSelectorList.selectors.forEach((selector) => {
            const selectorName = selector.toString();
            currentScopes.push(scopeList.getOrCreate(selectorName));
          });
          return walk.skip;
        }

        case "Declaration":
          if (isCustomProperty(node)) {
            const customProperty = CustomProperty.from(node);
            // const name = customProperty.name;
            currentScopes.forEach((scope) => {
              variableRegistry.register(scope.selector, customProperty);
              scope.addCustomProperty(customProperty);
            });

            return walk.skip;
          }
          break;

        case "Atrule":
          // skip because it has a SelectorList with different selectors from the ones parsed
          // by our Rule selectorlist. We will parse it eventually
          return walk.skip;
      }
    },
  });

  return variableRegistry;
};
