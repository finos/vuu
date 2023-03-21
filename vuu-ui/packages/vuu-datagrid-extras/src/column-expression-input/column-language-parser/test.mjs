import { parser } from "./generated/column-parser.js";

const strictParser = parser.configure({ strict: true });

export const walkTree = (tree, source) => {
  const cursor = tree.cursor();
  do {
    const { name, from, to } = cursor;

    switch (name) {
      case "ColumnExpression":
        console.log(`'${source.slice(from, to)}' is a ColumnExpression`);
        break;
      case "CallExpression":
        console.log(`'${source.slice(from, to)}' is a CallExpression`);
        break;
      case "ArgList":
        console.log(`'${source.slice(from, to)}' is an ArgList`);
        break;
      case "Function":
        console.log(`'${source.slice(from, to)}' is a Function`);
        break;
      case "ArithmeticExpression":
        console.log(`'${source.slice(from, to)}' is a ArithmeticExpression`);
        break;
      case "Times":
      case "Divide":
      case "Plus":
      case "Minus":
        console.log(`'${source.slice(from, to)}' is an Operator (${name})`);
        break;

      case "ParenthesizedExpression":
        console.log(`'${source.slice(from, to)}' is a ParenthesizedExpression`);
        break;
      case "Expression":
        console.log(`'${source.slice(from, to)}' is an Expression`);
        break;
      case "Column":
        console.log(`'${source.slice(from, to)}' is a Column`);
        break;
      case "Identifier":
        console.log(`'${source.slice(from, to)}' is an Identifier`);
        break;
      case "Number":
        console.log(`${source.slice(from, to)} is a Number`);
        break;

      default:
        console.log(
          `Node ${name} [${from}:${to}] '${source.substring(
            cursor.from,
            cursor.to
          )}'`
        );
    }
  } while (cursor.next());
};

const samples = [
  "=bid",
  "=200",
  "=bid+(price*quantity)",
  "=(price*quantity)*bid",
  "=price*quantity*bid",
  "=(i1-i2)-i3",
  "=(bid*ask)+(price-quantity)",
  "=(bid*100)+(price-50)",
  "=bid*100+price-50",
  "=bid*100.00+price-50.0*bid/price",
  "=price*quantity",
  "=(bid + ask) / 2",
  "=min(min(i1, i3), i2)",
  "=min(i1, i2)",
  "=text(i1, i2)",
  "=max(100, 200, 300)",
  "=concatenate(max(i1, i2), text(quantity))",
  "=right(client, 3)",
  "=left(client, 3)",
];

console.log("");

// const str = "=bid";
// const str = '=if(side="Buy","Y","N")';
// const str = '=if(price>1000,"High",if(price>100,"Medium","Low"))';
// const str = "=bid*100.00+price-50.0*bid/price";
// const str = "=min(min(i1, i3), i2)";
// const str = "=concatenate(max(i1, i2), text(quantity))";
const str = "=(bid*ask)+(price-quantity)";

try {
  strictParser.parse(str);
  console.log(`'str' is OK`);
} catch (e) {
  console.log(`'${str}' failed to parse`);
}

const result = parser.parse(str);

console.log("");

walkTree(result, str);
