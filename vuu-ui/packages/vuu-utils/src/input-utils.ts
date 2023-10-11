export const isCharacterKey = (key: string) => key.length === 1;

export const isQuoteKey = (evt: KeyboardEvent) => {
  return evt.key === '"' || evt.key === "'";
};
