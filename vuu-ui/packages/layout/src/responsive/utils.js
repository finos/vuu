const COLLAPSIBLE = 'data-collapsible';

const RESPONSIVE_ATTRIBUTE = {
  [COLLAPSIBLE]: true,
  'data-pad-left': true,
  'data-pad-right': true
};

export const isResponsiveAttribute = (propName) => RESPONSIVE_ATTRIBUTE[propName];

const isCollapsible = (propName) => propName === COLLAPSIBLE;

const COLLAPSIBLE_VALUE = {
  dynanic: 'dynamic',
  instant: 'instant',
  true: 'instant'
};

const collapsibleValue = (value) => COLLAPSIBLE_VALUE[value] ?? 'none';

export const extractResponsiveProps = (props) => {
  return Object.keys(props).reduce(
    (result, propName) => {
      const [toolbarProps, rest] = result;
      if (isResponsiveAttribute(propName)) {
        const value = isCollapsible(propName) ? collapsibleValue(props[propName]) : props[propName];

        toolbarProps[propName] = value;
        rest[propName] = undefined;
      }
      return result;
    },
    [{}, {}]
  );
};
