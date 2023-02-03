import { ReactElement } from "react";
import { LayoutModel } from "../layout-reducer";

const NO_PROPS = {};
export const getProp = (component: LayoutModel, propName: string) => {
  const props = getProps(component);
  return props[propName] ?? props[`data-${propName}`];
};

export const getProps = (component?: LayoutModel) =>
  component?.props || component || NO_PROPS;

export const getChildProp = (container: LayoutModel) => {
  const props = getProps(container);
  if (props.children) {
    const {
      children: [target, ...rest],
    } = props;
    if (rest.length > 0) {
      console.warn(
        `getChild expected a single child, found ${rest.length + 1}`
      );
    }
    return target as ReactElement;
  }
};
