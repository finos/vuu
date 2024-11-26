export const useHighlighting = (
  value: string,
  pattern: Lowercase<string>,
): string | JSX.Element => {
  if (pattern === "") {
    return value;
  }
  // eslint-disable-next-line react/display-name
  const lowercaseValue = value.toLowerCase();
  let start = 0;
  let end = lowercaseValue.indexOf(pattern);
  if (end === -1) {
    return value;
  }
  const results = [];

  while (end !== -1) {
    results.push(value.slice(start, end));
    start = end;
    end = start + pattern.length;
    results.push(
      <span className="vuuHighlight" key={start}>
        {value.slice(start, end)}
      </span>,
    );
    start = end;
    end = lowercaseValue.indexOf(pattern, start);
    if (end === -1 && start < lowercaseValue.length) {
      results.push(value.slice(start));
    }
  }

  return <span style={{ whiteSpace: "pre" }}>{results}</span>;
};
