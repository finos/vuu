export const lastWord = (text: string): string => {
  const trimmedText = text.trim();
  const pos = trimmedText.lastIndexOf(" ");
  if (pos === -1) {
    return trimmedText;
  } else {
    return trimmedText.slice(pos + 1);
  }
};

const capitalize = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1);

const regexp_worfify = /(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/;
export const wordify = (text: string) => {
  const [firstWord, ...rest] = text.split(regexp_worfify);
  return `${capitalize(firstWord)} ${rest.join(" ")}`;
};
