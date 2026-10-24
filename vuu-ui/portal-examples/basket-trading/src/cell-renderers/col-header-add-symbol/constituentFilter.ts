export const constituentFilter = (rics: string[]): string => {
  let clauses = [...new Set(rics)]
    .sort()
    .map((ric) => `ric != ${JSON.stringify(ric)}`);
  // Balance the expression to avoid the parser's limit on long boolean chains.
  while (clauses.length > 1) {
    const groups: string[] = [];
    for (let index = 0; index < clauses.length; index += 2) {
      groups.push(
        index + 1 < clauses.length
          ? `(${clauses[index]} and ${clauses[index + 1]})`
          : clauses[index],
      );
    }
    clauses = groups;
  }
  return clauses[0] ?? "";
};
