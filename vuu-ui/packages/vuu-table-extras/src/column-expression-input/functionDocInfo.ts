import { createEl } from "@finos/vuu-utils";
import { ColumnFunctionDescriptor } from "./column-function-descriptors";

export const functionDocInfo = ({
  name,
  description,
  example,
  params,
  type,
}: ColumnFunctionDescriptor) => {
  const rootElement = createEl("div", "vuuFunctionDoc");
  const headingElement = createEl("div", "function-heading");

  const nameElement = createEl("span", "function-name", name);
  const paramElement = createEl("span", "param-list", params.description);
  const typeElement = createEl("span", "function-type", type);

  headingElement.appendChild(nameElement);
  headingElement.appendChild(paramElement);
  headingElement.appendChild(typeElement);

  const child2 = createEl("p", undefined, description);

  rootElement.appendChild(headingElement);
  rootElement.appendChild(child2);

  if (example) {
    const exampleElement = createEl("div", "example-container");
    const expressionElement = createEl(
      "div",
      "example-expression",
      example.expression
    );
    const resultElement = createEl("div", "example-result", example.result);

    exampleElement.appendChild(expressionElement);

    rootElement.appendChild(exampleElement);
    rootElement.appendChild(resultElement);
  }

  return rootElement;
};
