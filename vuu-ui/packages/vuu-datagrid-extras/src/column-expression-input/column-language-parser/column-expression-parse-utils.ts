import { parser } from "./generated/column-parser";

const strictParser = parser.configure({ strict: true });

export const isCompleteExpression = (src: string) => {
  try {
    strictParser.parse(src);
    return true;
  } catch (err) {
    return false;
  }
};
