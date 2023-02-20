import { createEl } from "@finos/vuu-utils";

export const filterInfo = (
  filterName: string,
  filterQuery: string
  // filter: Filter
) => {
  const rootElement = createEl("div", "vuuFunctionDoc");
  const headingElement = createEl("div", "function-heading");

  const nameElement = createEl("span", "function-name", filterName);
  // const paramElement = createEl("span", "param-list", params.description);
  // const typeElement = createEl("span", "function-type", type);

  headingElement.appendChild(nameElement);
  // headingElement.appendChild(paramElement);
  // headingElement.appendChild(typeElement);

  const child2 = createEl("p", undefined, filterQuery);

  rootElement.appendChild(headingElement);
  rootElement.appendChild(child2);

  return rootElement;
};
