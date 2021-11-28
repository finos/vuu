const QUOTE = '"';

export const getCompletion = (
  suggestions,
  highlightedIdx,
  cursorAtEndOfText = false,
  selectedCount,
  lookAhead = false
) => {
  const idx =
    highlightedIdx === undefined || highlightedIdx >= suggestions.length ? 0 : highlightedIdx;

  const suggestion = suggestions[idx];
  let completion = '';
  let typedName;

  if (suggestion) {
    ({ completion = '', typedName } = suggestion);
    if (completion === 'EOF') {
      return [''];
    }
  }

  if (completion.indexOf(' ') != -1) {
    completion = QUOTE + completion + QUOTE;
  }

  const leadingSpace = getLeadingSpace(completion, cursorAtEndOfText, selectedCount, lookAhead);

  const parserTextWithTypedSubstitution = lookAhead ? undefined : typedName;

  return [leadingSpace + completion, parserTextWithTypedSubstitution];
};

function getLeadingSpace(completion, cursorAtEndOfText, selectedCount, lookAhead) {
  if (selectedCount > 1 && completion !== ']') {
    return ', ';
  } else if (lookAhead && selectedCount === 1 && completion !== ']') {
    return ', ';
  } else if (cursorAtEndOfText) {
    return ' ';
  } else {
    return '';
  }
}
