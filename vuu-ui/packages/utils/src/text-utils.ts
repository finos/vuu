export const lastWord = (text: string): string => {
  const trimmedText = text.trim();
  const pos = trimmedText.lastIndexOf(' ');
  if (pos === -1) {
    return trimmedText;
  } else {
    return trimmedText.slice(pos + 1);
  }
};
