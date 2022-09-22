const COLLAPSIBLE = 'data-collapsible';

const RESPONSIVE_ATTRIBUTE: { [key: string]: boolean } = {
  [COLLAPSIBLE]: true,
  'data-pad-start': true,
  'data-pad-end': true
};

export const isResponsiveAttribute = (propName: string): boolean =>
  RESPONSIVE_ATTRIBUTE[propName] ?? false;

const isCollapsible = (propName: string) => propName === COLLAPSIBLE;

const COLLAPSIBLE_VALUE: { [key: string]: string } = {
  dynamic: 'dynamic',
  instant: 'instant',
  true: 'instant'
};

const collapsibleValue = (value: string) => COLLAPSIBLE_VALUE[value] ?? 'none';

type Props = { [key: string]: any };
export const extractResponsiveProps = (props: Props) => {
  return Object.keys(props).reduce<[Props, Props]>(
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
