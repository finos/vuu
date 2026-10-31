import fs from "fs";
import { exec } from "child_process";

export const execWait = (cmd, cwd = ".") =>
  new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      console.log(stdout);
      // TODO whats the difference between err and stdErr ?
      if (err ?? stderr) {
        reject(err ?? stderr);
      } else {
        resolve();
      }
    });
  });

export function removeFolder(folderPath) {
  fs.rmSync(folderPath, { recursive: true, force: true });
}

export function createFolder(folderPath) {
  removeFolder(folderPath);
  fs.mkdirSync(folderPath, { recursive: true });
}

export const readPackageJson = (path = "package.json") => readJson(path);

export const readJson = (path) => {
  const rawdata = fs.readFileSync(path);
  const json = JSON.parse(rawdata);
  return json;
};

export const writeJsonFileFile = async (json, path) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
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
export const getCommandLineArg = (argName, expectValue, defaultValue) => {
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
    return matchedArg;
  }
};

const args = process.argv.slice(2);

export const withArgs = (...argNames) => {
  const commandLineArgs = argNames
    .map((arg) =>
      args.includes(arg) || args.includes("--" + arg) ? ` --${arg}` : "",
    )
    .join("");
  return commandLineArgs ? ` -- ${commandLineArgs}` : "";
};
