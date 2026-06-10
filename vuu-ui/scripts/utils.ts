import { spawnSync } from "node:child_process";

/**
 * Runs a command synchronously, streams child output to the current terminal,
 * and exits the current process if the command fails.
 * Uses a shell on Windows to ensure commands like npm resolve correctly.
 */
export const runCommandSync = (command: string, args: string[]) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

/**
 * argName can be a simple switch e.g --watch
 * yarn style args ...
 * argName can also expect a value following eg --features my-feature
 * npm style args ...
 * argName can also expect a value following eg -- --features=my-feature
 * if expectValue is true, user MUST provide a value
 * defaultValue, if provided, is returned ONLY if user does not use the switch at all
 * @param {
 *
 * } argName
 * @param {*} expectValue
 * @param {*} defaultValue
 * @returns
 */
export const getCommandLineArg = (
  argName: string,
  /**
   * if expect value is true, param should take the form --features=myfeature.
   * if expectValue is false, param should take the form --features
   */
  expectValue?: boolean,
  defaultValue?: string,
) => {
  // npm style args --arg=xyz
  const argEquals = argName + "=";
  const args = process.argv.slice(2);
  const matchedArg = args.find(
    (arg) => arg === argName || arg.startsWith(argEquals),
  );
  if (matchedArg && expectValue) {
    if (matchedArg.startsWith(argEquals)) {
      const posEquals = matchedArg.indexOf("=");
      return matchedArg.slice(posEquals + 1);
    } else {
      const pos = args.indexOf(argName);
      const argValue = args[pos + 1];
      if (argValue === undefined) {
        console.log(`value expected after arg ${argName}`);
      } else if (argValue.startsWith("--")) {
        console.log(`value expected after arg ${argName}, found ${argValue}`);
      } else {
        return argValue;
      }
    }
  } else if (!matchedArg && defaultValue) {
    return defaultValue;
  } else {
    if (matchedArg?.startsWith("--")) {
      return matchedArg.slice(2);
    }
    return matchedArg;
  }
};
