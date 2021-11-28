import { createElement, useRef } from 'react';
import { roundDecimal } from './grid-cell-number-utils';

const defaultFormatter = (value) => (value == null ? '' : value);

const getFormatter = (column) => {
  if (column.type) {
    const { name, format } = column.type;
    if (name === 'number') {
      return numericFormatter(format);
    }
  }
  return defaultFormatter;
};

const useFormatter = (column) => {
  // console.log(`useFormatter for ${JSON.stringify(column.type)}`)
  const formatter = useRef(getFormatter(column));
  return [formatter.current];
};

export default useFormatter;

const DEFAULT_NUMERIC_FORMATTING = {};

function numericFormatter({
  align = 'right',
  alignOnDecimals = false,
  decimals = 4,
  zeroPad = false
} = DEFAULT_NUMERIC_FORMATTING) {
  const props = { className: 'num' };
  // eslint-disable-next-line react/display-name
  return (value) => {
    const number =
      typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : null;
    return createElement(
      'div',
      props,
      roundDecimal(number, align, decimals, zeroPad, alignOnDecimals)
    );
  };
}

// class NumberFormatter {

//     static cellCSS({formatting=defaultFormatting}){
//         const {align=Right} = formatting;
//         if (align === Right){
//             return Right;
//         } else {
//             return '';
//         }
//     }

//     static formatter(value, {formatting=defaultFormatting}){
//         const {align, decimals, zeroPad, alignOnDecimals=false} = formatting;
//         const numberOfDecimals = numberOr(decimals,4);
//         const number = typeof value === 'number' ? value :
//                        typeof value === 'string' ? parseFloat(value) :
//                        null;
//         return (
//             <div className='num'>
//                 {roundDecimal(number, align, numberOfDecimals, zeroPad, alignOnDecimals)}
//             </div>
//         )
//     }

// }
