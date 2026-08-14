export type SingularPluralForm = {
  singular: string;
  plural: string;
};

export type ItemTypeName = string | SingularPluralForm;

export const lastWord = (text: string): string => {
  const trimmedText = text.trim();
  const pos = trimmedText.lastIndexOf(" ");
  if (pos === -1) {
    return trimmedText;
  } else {
    return trimmedText.slice(pos + 1);
  }
};

export const capitalize = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1);

export const singularForm = (typeName: ItemTypeName) =>
  typeof typeName === "string" ? typeName : typeName.singular;

export const pluralForm = (typeName: ItemTypeName) =>
  typeof typeName === "string" ? `${typeName}s` : typeName.plural;

const regexp_worfify = /(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/;
export const wordify = (text: string) => {
  const [firstWord, ...rest] = text.split(regexp_worfify);
  return `${capitalize(firstWord)} ${rest.join(" ")}`;
};
