export type ColumnFunctionDescriptor = {
  accepts: "string" | "number" | "any" | Array<"string" | "number">;
  description: string;
  example: {
    expression: string;
    result: string;
  };
  name: string;
  params: {
    count?: number;
    description: string;
  };
  type: "string" | "number" | "boolean" | "variable";
};

export const columnFunctionDescriptors: ColumnFunctionDescriptor[] = [
  {
    accepts: "string",
    description:
      "Returns multiple string values as a single joined string. Arguments may be string literal values, string columns or other string expressions. Non string arguments may also be included, these will be converted to strings.",
    example: {
      expression: 'concatenate("example", "-test")',
      result: "example-test",
    },
    name: "concatenate",
    params: {
      description: "( string, string, [ string* ] )",
    },
    type: "string",
  },

  {
    accepts: ["string", "number"],
    description:
      "Returns the leftmost <number> characters from <string>. First argument may be a string literal, string column or other string expression.",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "left",
    params: {
      count: 2,
      description: "( string, number )",
    },
    type: "string",
  },
  {
    accepts: "string",
    description:
      "Returns the number of characters in <string>. Argument may be a string literal, string column or other string expression.",
    example: {
      expression: 'len("example")',
      result: "7",
    },
    name: "len",
    params: {
      description: "(string)",
    },
    type: "number",
  },
  {
    accepts: "string",
    description: "Display a string values as all lowercase",
    example: {
      expression: 'lower("examPLE")',
      result: '"example"',
    },
    name: "lower",
    params: {
      description: "( string )",
    },
    type: "string",
  },
  {
    accepts: "string",
    description: "Display a string values as all uppercase",
    example: {
      expression: 'upper("example")',
      result: '"EXAMPLE"',
    },
    name: "upper",
    params: {
      description: "( string )",
    },
    type: "string",
  },
  {
    accepts: ["string", "number"],
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "right",
    params: {
      description: "( string )",
    },
    type: "string",
  },
  {
    accepts: "string",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "replace",
    params: {
      description: "( string )",
    },
    type: "string",
  },
  {
    accepts: "number",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "text",
    params: {
      description: "( string )",
    },
    type: "string",
  },
  {
    accepts: "string",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "contains",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },
  {
    accepts: "string",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "starts",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },
  {
    accepts: "string",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "ends",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },
  {
    accepts: "number",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "min",
    params: {
      description: "( string )",
    },
    type: "number",
  },
  {
    accepts: "number",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "max",
    params: {
      description: "( string )",
    },
    type: "number",
  },
  {
    accepts: "number",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "sum",
    params: {
      description: "( string )",
    },
    type: "number",
  },
  {
    accepts: "number",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "round",
    params: {
      description: "( string )",
    },
    type: "number",
  },
  {
    accepts: "any",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "or",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },
  {
    accepts: "any",
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "and",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },
  {
    accepts: "any",
    description:
      "Return one of two possible result values, depending on the evaluation of a filter expression. If <filterExpression> resolves to true, result is <expression1>, otherwise <expression2>. ",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "if",
    params: {
      description: "( filterExpression, expression1, expression 2)",
    },
    type: "variable",
  },
];
