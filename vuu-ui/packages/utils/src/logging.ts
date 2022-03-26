export const logColor = {
  plain: 'color: black; font-weight: normal',
  blue: 'color: blue; font-weight: bold',
  brown: 'color: brown; font-weight: bold',
  green: 'color: green; font-weight: bold'
};

const { plain } = logColor;

export const createLogger = (source: string, labelColor: string = plain, msgColor: string = plain) => ({
  log: (msg: string, args: any = '') =>
    console.log(`[${Date.now()}]%c[${source}] %c${msg}`, labelColor, msgColor, args),
  warn: (msg: string) => console.warn(`[${source}] ${msg}`)
});
