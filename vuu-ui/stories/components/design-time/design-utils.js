import { stretchAlign, stretchDirection, stretchJustify } from '@vuu-ui/layout';

const stretchStyle = (attribute, value) => {
  switch (attribute) {
    case 'alignItems':
      return stretchAlign(value);
    case 'justifyContent':
      return stretchJustify(value);
    case 'flexDirection':
      return stretchDirection(value);
    default:
      return value;
  }
};

export const recomputeLayoutStyle = (layoutModel, attribute, value) => {
  const { layoutStyle, style } = layoutModel;
  const recomputedLayoutStyle = {
    ...layoutModel,
    style: {
      ...style,
      [attribute]: value
    },
    layoutStyle: {
      ...layoutStyle,
      [attribute]: stretchStyle(attribute, value)
    }
  };

  if (attribute === 'width' && typeof value === 'number') {
    delete recomputedLayoutStyle.style.flex;
    delete recomputedLayoutStyle.layoutStyle.flexBasis;
    delete recomputedLayoutStyle.layoutStyle.flexGrow;
    delete recomputedLayoutStyle.layoutStyle.flexShrink;
  } else if (attribute === 'flex') {
    recomputedLayoutStyle.style.flex = '1 1 auto';
    recomputedLayoutStyle.layoutStyle.flexBasis = 'auto';
    recomputedLayoutStyle.layoutStyle.flexGrow = 1;
    recomputedLayoutStyle.layoutStyle.flexShrink = 1;

    delete recomputedLayoutStyle.style.width;

    delete recomputedLayoutStyle.layoutStyle.width;
  }

  return recomputedLayoutStyle;
};
