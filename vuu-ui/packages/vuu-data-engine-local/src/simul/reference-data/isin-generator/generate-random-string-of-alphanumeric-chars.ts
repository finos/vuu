import { generateRandomAlphanumeric } from "./generate-random-alphanumeric";

export const generateRandomStringOfAlphanumericChars = () => {
  let string = "";
  for (let i = 0; i < 2; i++) {
    string = string + generateRandomAlphanumeric();
  }
  return string;
};
