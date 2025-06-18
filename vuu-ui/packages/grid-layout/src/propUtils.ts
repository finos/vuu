import { ReactElement } from "react";
import { LayoutModel } from "@vuu-ui/vuu-utils";

const NO_PROPS = {};
export const getProp = (
  component: LayoutModel | undefined,
  propName: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = getProps(component) as any;
  return props[propName] ?? props[`data-${propName}`];
};

export const getProps = (component?: LayoutModel) =>
  component?.props || component || NO_PROPS;

export const getChildProp = (container: LayoutModel) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = getProps(container) as any;
  if (props.children) {
    const {
      children: [target, ...rest],
    } = props;
    if (rest.length > 0) {
      console.warn(
        `getChild expected a single child, found ${rest.length + 1}`,
      );
    }
    return target as ReactElement;
  }
};
