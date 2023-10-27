export type ColumnFunctionDescriptor = {
  accepts:
    | "string"
    | "number"
    | "boolean"
    | "any"
    | Array<"string" | "number" | "boolean">;
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
  /**
   * and
   */
  {
    accepts: ["boolean"],
    description:
      "Applies boolean and operator across supplied parameters to returns a single boolean result",
    example: {
      expression: 'and(ccy="EUR",quantity=0)',
      result: "true | false",
    },
    name: "and",
    params: {
      description: "( boolean, [ boolean* ] )",
    },
    type: "boolean",
  },

  /**
   * concatenate()
   */
  {
    accepts: "string",
    description:
      "Returns multiple string values as a single joined string. Arguments may be string literal values, string columns or other string expressions. Non string arguments may also be included, these will be converted to strings.",
    example: {
      expression: 'concatenate("example", "-test")',
      result: '"example-test"',
    },
    name: "concatenate",
    params: {
      description: "( string, string, [ string* ] )",
    },
    type: "string",
  },
  /**
   * contains()
   */
  {
    accepts: ["string", "string"],
    description:
      "Tests a string value to determine whether it contains a given substring. Accepts two arguments: source text and target substring. Returns true if <source text> contains one or more occurrences of <target subscring>",
    example: {
      expression: 'contains("Royal Bank of Scotland", "bank")',
      result: "true",
    },
    name: "contains",
    params: {
      description: "( string )",
    },
    type: "boolean",
  },

  /**
   * left()
   */
  {
    accepts: ["string", "number"],
    description:
      "Returns the leftmost <number> characters from <string>. First argument may be a string literal, string column or other string expression.",
    example: {
      expression: 'left("USD Benchmark Report", 3)',
      result: '"USD"',
    },
    name: "left",
    params: {
      count: 2,
      description: "( string, number )",
    },
    type: "string",
  },
  /**
   * len()
   */
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
  /**
   * lower()
   */
  {
    accepts: "string",
    description:
      "Convert a string value to lowercase. Argument may be a string column or other string expression.",
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
  /**
   * or
   */
  {
    accepts: ["boolean"],
    description:
      "Applies boolean or operator across supplied parameters to returns a single boolean result",
    example: {
      expression: 'or(status="cancelled",quantity=0)',
      result: "true | false",
    },
    name: "or",
    params: {
      description: "( boolean, [ boolean* ] )",
    },
    type: "boolean",
  },

  /**
   * upper()
   */
  {
    accepts: "string",
    description:
      "Convert a string value to uppercase. Argument may be a string column or other string expression.",
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
  /**
   * right()
   */
  {
    accepts: ["string", "number"],
    description:
      "Returns the rightmost <number> characters from <string>. First argument may be a string literal, string column or other string expression.",
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
  /**
   * replace()
   */
  {
    accepts: ["string", "string", "string"],
    description:
      "Replace characters within a string. Accepts three arguments: source text, text to replace and replacement text. Returns a copy of <source text> with any occurrences of <text to replace> replaced by <replacement text>",
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
  /**
   * text()
   */
  {
    accepts: "number",
    description: "Converts a number to a string.",
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
  /**
   * starts()
   */
  {
    accepts: "string",
    description:
      "Tests a string value to determine whether it starts with a given substring. Accepts two arguments: source text and target substring. Returns true if <source text> starts with <target subscring>.",
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
  /**
   * starts()
   */
  {
    accepts: "string",
    description:
      "Tests a string value to determine whether it ends with a given substring. Accepts two arguments: source text and target substring. Returns true if <source text> ends with <target subscring>.",
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
