import { generateRandomBaseTenNumber } from "./generate-random-base-ten-number";

export const generateRandomStringOfBaseTenChars = () => {
  let string = "";
  for (let i = 0; i < 6; i++) {
    string = string + generateRandomBaseTenNumber();
  }
  return string;
};
