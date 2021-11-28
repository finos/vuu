import React from 'react';
import './layout-configurator.css';

const DIMENSIONS = {
  margin: {
    top: 'marginTop',
    right: 'marginRight',
    bottom: 'marginBottom',
    left: 'marginLeft'
  },
  border: {
    top: 'borderWidthTop',
    right: 'borderRight',
    bottom: 'borderBottom',
    left: 'borderLeft'
  },
  padding: {
    top: 'paddingTop',
    right: 'paddingRight',
    bottom: 'paddingBottom',
    left: 'paddingLeft'
  }
};

const LayoutBox = ({ feature, children, style, onChange }) => {
  return (
    <div className={`LayoutBox layout-${feature} layout-outer`}>
      <div className={`layout-top`}>
        <span className="layout-title">{feature}</span>
        <input
          className="layout-input"
          value={style.top}
          onChange={(e) => onChange(feature, 'top', parseInt(e.target.value, 10))}
        />
      </div>
      <div className={`layout-inner`}>
        <div className={`layout-left`}>
          <input
            className="layout-input"
            value={style.left}
            onChange={(e) => onChange(feature, 'left', e.target.value)}
          />
        </div>
        {children}
        <div className={`layout-right`}>
          <input
            className="layout-input"
            value={style.right}
            onChange={(e) => onChange(feature, 'right', e.target.value)}
          />
        </div>
      </div>
      <div className={`layout-bottom`}>
        <input
          className="layout-input"
          value={style.bottom}
          onChange={(e) => onChange(feature, 'bottom', e.target.value)}
        />
      </div>
    </div>
  );
};

// BORDER_STYLES diplicated in inlay/layoutUtils
export const BORDER_STYLES = {
  border: true,
  borderWidth: true,
  borderWidthTop: true,
  borderRight: true,
  borderEnd: true,
  borderBottom: true,
  borderLeft: true,
  borderStart: true,
  borderWidthTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true
};

const CSS_DIGIT = '(\\d+)(?:px)?';
const CSS_MEASURE = `^(?:${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT}(?:\\s${CSS_DIGIT})?)?)?)$`;
const CSS_REX = new RegExp(CSS_MEASURE);
const BORDER_REX = /^(?:(\d+)(?:px)\ssolid\s([a-zA-Z,0-9().]+))$/;
const BORDER_LIST = Object.keys(BORDER_STYLES);

export default class LayoutConfigurator extends React.Component {
  constructor(props) {
    super(props);

    const [layoutStyle, visualStyle] = normalizeBorderStyle(props.managedStyle);
    this.state = {
      layoutStyle,
      visualStyle
    };

    // console.log(`LayoutConfigurator constructor
    //     ${JSON.stringify(this.state.layoutStyle)}
    //     ${JSON.stringify(this.state.visualStyle)}
    // `)

    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { layoutStyle, visualStyle } = nextProps;

    if (layoutStyle !== this.props.layoutStyle || visualStyle !== this.props.visualStyle) {
      // console.log(`LayoutConfigurator componentWillReceiveProps
      // ${JSON.stringify(layoutStyle)}
      // ${JSON.stringify(visualStyle)}
      // `)

      const [nextLayoutStyle, nextVisualStyle] = normalizeBorderStyle(layoutStyle, visualStyle);

      this.setState({
        layoutStyle: nextLayoutStyle,
        visualStyle: nextVisualStyle
      });

      // console.log(`LayoutConfigurator componentWillReceiveProps
      // ${JSON.stringify(nextLayoutStyle)}
      // ${JSON.stringify(nextVisualStyle)}
      // `)
    }
  }

  handleChange(feature, dimension, strValue) {
    const value = parseInt(strValue || '0', 10);
    const property = DIMENSIONS[feature][dimension];
    this.props.onChange(property, value);
  }

  render() {
    const { width, height, style } = this.props;
    const {
      marginTop: mt = 0,
      marginRight: mr = 0,
      marginBottom: mb = 0,
      marginLeft: ml = 0
    } = this.state.layoutStyle;
    const {
      borderWidthTop: bt = 0,
      borderRight: br = 0,
      borderBottom: bb = 0,
      borderLeft: bl = 0
    } = this.state.layoutStyle;
    const {
      paddingTop: pt = 0,
      paddingRight: pr = 0,
      paddingBottom: pb = 0,
      paddingLeft: pl = 0
    } = this.state.layoutStyle;
    return (
      <div className="LayoutConfigurator" style={{ width, height, ...style }}>
        <LayoutBox
          feature="margin"
          style={{ top: mt, right: mr, bottom: mb, left: ml }}
          onChange={this.handleChange}
        >
          <LayoutBox
            feature="border"
            style={{ top: bt, right: br, bottom: bb, left: bl }}
            onChange={this.handleChange}
          >
            <LayoutBox
              feature="padding"
              style={{ top: pt, right: pr, bottom: pb, left: pl }}
              onChange={this.handleChange}
            >
              <div className="layout-content" />
            </LayoutBox>
          </LayoutBox>
        </LayoutBox>
      </div>
    );
  }
}

// TODO merge the following two functions
export function normalizeStyles(layoutStyle = NO_STYLE, visualStyle = NO_STYLE) {
  const {
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    ...style
  } = layoutStyle;

  if (typeof margin === 'number') {
    style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = margin;
  } else if (typeof margin === 'string') {
    const match = CSS_REX.exec(margin);
    if (match === null) {
      console.error(`Invalid css value for margin '${margin}'`);
    } else {
      const [, pos1, pos2, pos3, pos4] = match;
      const pos123 = pos1 && pos2 && pos3;
      if (pos123 && pos4) {
        style.marginTop = parseInt(pos1, 10);
        style.marginRight = parseInt(pos2, 10);
        style.marginBottom = parseInt(pos3, 10);
        style.marginLeft = parseInt(pos4, 10);
      } else if (pos123) {
        style.marginTop = parseInt(pos1, 10);
        style.marginRight = style.marginLeft = parseInt(pos2, 10);
        style.marginBottom = parseInt(pos3, 10);
      } else if (pos1 && pos2) {
        style.marginTop = style.marginBottom = parseInt(pos1, 10);
        style.marginRight = style.marginLeft = parseInt(pos2, 10);
      } else {
        style.marginTop =
          style.marginRight =
          style.marginBottom =
          style.marginLeft =
            parseInt(pos1, 10);
      }
    }
  }
  if (typeof marginTop === 'number') style.marginTop = marginTop;
  if (typeof marginRight === 'number') style.marginRight = marginRight;
  if (typeof marginBottom === 'number') style.marginBottom = marginBottom;
  if (typeof marginLeft === 'number') style.marginLeft = marginLeft;

  if (typeof padding === 'number') {
    style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = padding;
  } else if (typeof padding === 'string') {
    const match = CSS_REX.exec(padding);
    if (match === null) {
      console.error(`Invalid css value for padding '${padding}'`);
    } else {
      const [, pos1, pos2, pos3, pos4] = match;
      const pos123 = pos1 && pos2 && pos3;
      if (pos123 && pos4) {
        style.paddingTop = parseInt(pos1, 10);
        style.paddingRight = parseInt(pos2, 10);
        style.paddingBottom = parseInt(pos3, 10);
        style.paddingLeft = parseInt(pos4, 10);
      } else if (pos123) {
        style.paddingTop = parseInt(pos1, 10);
        style.paddingRight = style.paddingLeft = parseInt(pos2, 10);
        style.paddingBottom = parseInt(pos3, 10);
      } else if (pos1 && pos2) {
        style.paddingTop = style.paddingBottom = parseInt(pos1, 10);
        style.paddingRight = style.paddingLeft = parseInt(pos2, 10);
      } else {
        style.paddingTop =
          style.paddingRight =
          style.paddingBottom =
          style.paddinggLeft =
            parseInt(pos1, 10);
      }
    }
  }
  if (typeof paddingTop === 'number') style.paddingTop = paddingTop;
  if (typeof paddingRight === 'number') style.paddingRight = paddingRight;
  if (typeof paddingBottom === 'number') style.paddingBottom = paddingBottom;
  if (typeof paddingLeft === 'number') style.paddingLeft = paddingLeft;

  return normalizeBorderStyle(style, visualStyle);
}

function normalizeBorderStyle(style = NO_STYLE) {
  if (BORDER_LIST.some((bs) => style[bs])) {
    let match;

    let {
      border,
      borderWidth,
      borderWidthTop = style.borderWidthTopWidth,
      borderRight = style.borderRightWidth,
      borderBottom = style.borderBottomWidth,
      borderLeft = style.borderLeftWidth,
      borderColor,
      ...rest
    } = style;

    if (border || borderWidth || borderWidthTop || borderRight || borderBottom || borderLeft) {
      if (typeof border === 'string' && (match = BORDER_REX.exec(border))) {
        // what if both border and borderWidth are specified ?
        [, borderWidth, borderColor] = match;
        borderWidth = parseInt(borderWidth, 10);
      }

      if (borderWidth) {
        borderWidthTop = borderWidthTop === undefined ? borderWidth : borderWidthTop;
        borderRight = borderRight === undefined ? borderWidth : borderRigh;
        borderBottom = borderBottom === undefined ? borderWidth : borderBottom;
        borderLeft = borderLeft === undefined ? borderWidth : borderLeft;
      }

      borderColor = borderColor || 'black';
      const boxShadow = `
                ${borderColor} ${borderLeft || 0}px ${borderWidthTop || 0}px 0 0 inset,
                ${borderColor} ${-borderRight || 0}px ${-borderBottom || 0}px 0 0 inset`;

      return [
        {
          ...rest,
          borderWidthTop,
          borderRight,
          borderBottom,
          borderLeft
        },
        {
          ...visualStyle,
          borderColor,
          borderStyle: 'solid',
          boxShadow
        }
      ];
    } else {
      return [style, visualStyle];
    }
  } else {
    return [style, visualStyle];
  }
}
