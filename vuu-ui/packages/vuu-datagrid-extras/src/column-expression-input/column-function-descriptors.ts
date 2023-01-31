export type ColumnFunctionDescriptor = {
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
    description:
      "Returns multiple string values as a single joined string. Arguments may be string literal values, string columns or other string expressions. Non string arguments may alsp be included, these will be converted to strings.",
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
    description: "Display a string values as all lowercase",
    example: {
      expression: 'lower("examPLE")',
      result: '"example"',
    },
    name: "lower",
    params: {
      description: "(arg: string)",
    },
    type: "string",
  },
  {
    description: "Display a string values as all uppercase",
    example: {
      expression: 'upper("example")',
      result: '"EXAMPLE"',
    },
    name: "upper",
    params: {
      description: "(arg: string)",
    },
    type: "string",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "right",
    params: {
      description: "(arg: string)",
    },
    type: "string",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "replace",
    params: {
      description: "(arg: string)",
    },
    type: "string",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "text",
    params: {
      description: "(arg: string)",
    },
    type: "string",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "contains",
    params: {
      description: "(arg: string)",
    },
    type: "boolean",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "starts",
    params: {
      description: "(arg: string)",
    },
    type: "boolean",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "ends",
    params: {
      description: "(arg: string)",
    },
    type: "boolean",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "min",
    params: {
      description: "(arg: string)",
    },
    type: "number",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "max",
    params: {
      description: "(arg: string)",
    },
    type: "number",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "sum",
    params: {
      description: "(arg: string)",
    },
    type: "number",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "round",
    params: {
      description: "(arg: string)",
    },
    type: "number",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "or",
    params: {
      description: "(arg: string)",
    },
    type: "boolean",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "and",
    params: {
      description: "(arg: string)",
    },
    type: "boolean",
  },
  {
    description: "blah",
    example: {
      expression: "blah",
      result: "blah",
    },
    name: "if",
    params: {
      description: "(filterExpression, resultTrue, resultFalse)",
    },
    type: "variable",
  },
];
