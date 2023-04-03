import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const readPackageJson = (path = "package.json") => readJson(path);

export const readJson = (path) => {
  let rawdata = fs.readFileSync(path);
  let json = JSON.parse(rawdata);
  return json;
};

function frontPad(text, length) {
  const spaces = Array(length).fill(" ").join("");
  return (spaces + text).slice(-length);
}

export const formatBytes = (bytes, decimals = 2, displayLength = 10) => {
  if (bytes === 0) return "0 Bytes";
  const { log, floor, pow } = Math;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = floor(log(bytes) / log(k));
  return frontPad(
    parseFloat((bytes / pow(k, i)).toFixed(dm)) + " " + sizes[i],
    displayLength
  );
};

export const formatDuration = ({ seconds, nanoSeconds }) =>
  `${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms`;

export const execWait = (cmd, cwd = ".") =>
  new Promise((resolve, reject) => {
    // const newProcess = exec(cmd, { cwd }, (err, stdout, stderr) => {
    exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve();
    });
    // newProcess.stdout.on("data", function (data) {
    //   console.log(data);
    // });
  });

export function copyFolderSync(from, to) {
  if (fs.lstatSync(from).isFile()) {
    fs.copyFileSync(from, to);
  } else {
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach((element) => {
      if (fs.lstatSync(path.join(from, element)).isFile()) {
        fs.copyFileSync(path.join(from, element), path.join(to, element));
      } else {
        copyFolderSync(path.join(from, element), path.join(to, element));
      }
    });
  }
}

export const assertFileExists = (fileName, exitIfFalse) => {
  let isFile = false;
  try {
    isFile = fs.lstatSync(path.resolve(fileName)).isFile();
  } catch (e) {
    // ignore, we handle it below
  }
  if (!isFile) {
    const message =
      typeof exitIfFalse === "string"
        ? exitIfFalse
        : `file ${fileName} not found`;
    console.error(message);
    if (exitIfFalse) {
      process.exit(1);
    } else {
      return false;
    }
  }
  return true;
};

export const assertFolderExists = (folderName, exitIfFalse) => {
  let isFolder = false;
  try {
    isFolder = fs.lstatSync(path.resolve(folderName)).isDirectory();
  } catch (e) {
    // ignore, we handle it below
  }
  if (!isFolder) {
    console.error(`folder ${path.resolve(folderName)} not found`);
    if (exitIfFalse) {
      process.exit(1);
    } else {
      return false;
    }
  }
  return true;
};

export const writeMetaFile = async (meta, outdir) =>
  new Promise((resolve, reject) => {
    console.log(`write bundle metafile`);
    fs.writeFile(
      `${outdir}/meta.json`,
      JSON.stringify(meta, null, 2),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });

export const padRight = (str, length) => {
  return (str + Array(length).fill(" ").join("")).slice(0, length);
};
export const byFileName = ({ fileName: f1 }, { fileName: f2 }) => {
  return f2 > f1 ? -1 : f2 < f1 ? 1 : 0;
};

/**
 * argName can be a simple switch e.g --watch
 * argName can also expect a value following eg --features my-feature
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
  const args = process.argv.slice(2);
  const hasArg = args.includes(argName);
  if (hasArg && expectValue) {
    const pos = args.indexOf(argName);
    const argValue = args[pos + 1];
    if (argValue === undefined) {
      console.log(`value expected after arg ${argName}`);
    } else if (argValue.startsWith("--")) {
      console.log(`value expected after arg ${argName}, found ${argValue}`);
    } else {
      return argValue;
    }
  } else if (!hasArg && defaultValue) {
    return defaultValue;
  } else {
    return hasArg;
  }
};

const args = process.argv.slice(2);
export const withArgs = (...argNames) =>
  argNames
    .map((arg) => (args.includes("--" + arg) ? ` --${arg}` : ""))
    .join("");

const addSuffix = (target, suffix, pattern) => {
  if (typeof target === "string") {
    return target + suffix;
  } else if (typeof target === "object") {
    return Object.entries(target).reduce((out, [key, value]) => {
      if (pattern.test(key)) {
        out[key] = value + suffix;
      } else {
        out[key] = value;
      }
      return out;
    }, {});
  }
};

export const updateVersionAndDependencies = (packageJson, options) => {
  const { dependencies, devDependencies, peerDependencies, version } =
    packageJson;
  const { pattern, suffix } = options;
  if (pattern && suffix) {
    packageJson.dependencies = addSuffix(dependencies, suffix, pattern);
    packageJson.devDependencies = addSuffix(devDependencies, suffix, pattern);
    packageJson.peerDependencies = addSuffix(peerDependencies, suffix, pattern);
    packageJson.version = addSuffix(version, suffix);
  } else {
    console.warn("updateVersionAndDependencies:mo valid opts provided");
  }
};
