import { convertStringToBaseTenNumber } from "./convert-string-to-base-ten-number";
import { isOdd } from "./is-odd";

export const generateCusipCheckCode = (cusip: string): number => {
  const cusipLength = cusip.length;
  let currentValue;
  let total = 0;

  for (let i = 0; i < cusipLength; i++) {
    currentValue = cusip[i];

    const currentNumberToBaseTen = convertStringToBaseTenNumber(currentValue);

    let currentNumberOrPosition = isNaN(currentNumberToBaseTen)
      ? currentValue.charCodeAt(0) - "A".charCodeAt(0) + 10
      : parseInt(currentValue);

    if (isOdd(i)) {
      currentNumberOrPosition = currentNumberOrPosition * 2;
    }

    total =
      total +
      Math.floor(currentNumberOrPosition / 10) +
      (currentNumberOrPosition % 10);
  }
  const check = (10 - (total % 10)) % 10;
  return check;
};
