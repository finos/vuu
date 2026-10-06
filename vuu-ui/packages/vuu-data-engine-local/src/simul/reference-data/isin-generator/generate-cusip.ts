import { generateCusipCheckCode } from "./generate-cusip-check-code";
import { generateCusipWithoutCheckCode } from "./generate-cusip-without-check-code";

export const generateCusip = (): string => {
  const cusip = generateCusipWithoutCheckCode();
  const check = generateCusipCheckCode(cusip);

  return cusip + check;
};
