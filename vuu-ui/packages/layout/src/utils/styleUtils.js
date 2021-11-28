export const expandFlex = (flex) => {
  if (typeof flex === 'number') {
    return {
      flexBasis: 0,
      flexGrow: 1,
      flexShrink: 1
    };
  } else {
    throw Error(`"no support yet for flex value ${flex}`);
  }
};
