import { parse, walk } from "css-tree";
import {
  CustomProperty,
  isCustomProperty,
  SelectorList,
} from "./css-parse-model.mjs";
import {
  getTagCode,
  getTagCodes,
  getVariableGroups,
} from "./css-parse-model-utils.mjs";

export const parseTheme = (cssString) => {
  console.time("parse");
  const ast = parse(cssString, {
    parseCustomProperty: true,
  });
  console.timeEnd("parse");

  let currentSelectorList;
  const scopes = {};
  const customPropertyMap = {};
  const currentScope = [];

  walk(ast, {
    enter: (node) => {
      // console.log(`Enter ${node.type}`);
      switch (node.type) {
        case "SelectorList": {
          currentSelectorList = SelectorList.from(node);
          currentScope.length = 0;
          currentSelectorList.selectors.forEach((selector) => {
            const selectorName = selector.toString();
            if (!scopes[selectorName]) {
              scopes[selectorName] = [];
            }
            currentScope.push({
              selectorName,
              variables: scopes[selector.toString()],
            });
          });
          return walk.skip;
        }

        case "Declaration":
          if (isCustomProperty(node)) {
            const customProperty = CustomProperty.from(node);
            const name = customProperty.name;
            currentScope.forEach(({ selectorName, variables }) => {
              console.log(`add custom propert to scope`, {
                cp: customProperty.toJSON(),
              });
              variables.push(customProperty);
              if (!customPropertyMap[name]) {
                const tags = getVariableGroups(name);
                const tagCodes = tags.map(getTagCode);
                customPropertyMap[name] = tagCodes.join("");
              }
              const tagCode = getTagCode(selectorName);
              if (customPropertyMap[name]?.indexOf(tagCode) === -1) {
                const val = customPropertyMap[name];
                customPropertyMap[name] = tagCode + val;
              }
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

  return {
    customPropertyMap,
    scopes,
    tagCodes: getTagCodes(),
  };
};
