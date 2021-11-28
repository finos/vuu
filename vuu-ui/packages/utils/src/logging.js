export const logColor = {
  plain: 'color: black; font-weight: normal',
  blue: 'color: blue; font-weight: bold',
  brown: 'color: brown; font-weight: bold',
  green: 'color: green; font-weight: bold'
};

const { plain } = logColor;
export const createLogger = (source, labelColor = plain, msgColor = plain) => ({
  log: (msg, args = '') =>
    console.log(`[${Date.now()}]%c[${source}] %c${msg}`, labelColor, msgColor, args),
  warn: (msg) => console.warn(`[${source}] ${msg}`)
});
