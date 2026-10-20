// escape a value for use inside a double-quoted CSS attribute selector
export const cssAttributeValue = (value: string) =>
  Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return character === '"' || character === "\\" || code < 32 || code === 127
      ? `\\${code.toString(16)} `
      : character;
  }).join("");

export const byDataIcon = (iconName: string) =>
  `[data-icon="${cssAttributeValue(iconName)}"]`;

export const byId = (id: string) => `[id="${cssAttributeValue(id)}"]`;
