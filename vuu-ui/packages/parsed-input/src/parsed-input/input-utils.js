const QUOTE = '"';

export const getCompletion = (
  suggestions,
  itemId,
  cursorAtEndOfText = false,
  selectedCount,
  lookAhead = false
) => {
  const suggestion = suggestions.find((suggestion) => suggestion.id === itemId) || suggestions[0];
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

export const getCompletionAtIndex = (
  suggestions,
  highlightedIdx,
  cursorAtEndOfText = false,
  selectedCount,
  lookAhead = false
) => {
  const suggestion = suggestions.length > highlightedIdx ? suggestions[highlightedIdx] : undefined;
  let completion = '';
  let typedName;
  let isSelected = false;

  if (suggestion) {
    ({ completion = '', typedName, isSelected } = suggestion);
    if (completion === 'EOF' || isSelected) {
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
