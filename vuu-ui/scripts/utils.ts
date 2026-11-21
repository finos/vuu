import { exec as execCallback, spawn, spawnSync } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);

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
 * argName can also expect a value following eg --features my-feature
 * or npm style args eg -- --features=my-feature.
 */
export const getCommandLineArg = (
  argName: string,
  expectValue?: boolean,
  defaultValue?: string,
) => {
  const argEquals = `${argName}=`;
  const args = process.argv.slice(2);
  const matchedArg = args.find(
    (arg) => arg === argName || arg.startsWith(argEquals),
  );

  if (matchedArg && expectValue) {
    if (matchedArg.startsWith(argEquals)) {
      return matchedArg.slice(argEquals.length);
    }

    const argValue = args[args.indexOf(argName) + 1];
    if (argValue === undefined) {
      console.log(`value expected after arg ${argName}`);
    } else if (argValue.startsWith("--")) {
      console.log(`value expected after arg ${argName}, found ${argValue}`);
    } else {
      return argValue;
    }
  } else if (!matchedArg && defaultValue) {
    return defaultValue;
  } else {
    return matchedArg?.startsWith("--")
      ? matchedArg.slice(2)
      : matchedArg;
  }
};

const NPM_ERROR = /^npm (?:error|ERR!)\s*/;
const NPM_NOISE = /^npm (?:notice|warn|WARN)\b/;
// An "npm error" line with nothing after the prefix but a status code.
const NPM_EMPTY_ERROR = /^npm (?:error|ERR!)(?:\s+\d{3})?$/;
const NPM_LOG_POINTER = /complete log of this run/i;

/**
 * Picks up to `maxLines` lines from a failed command's stderr that explain the
 * failure, joined with " | ". npm writes notices (for `npm publish`, the whole
 * tarball listing) before its errors, so `npm error` lines are preferred.
 */
export const summarizeStderr = (stderr: string, maxLines = 3) => {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const npmErrors = lines
    .filter(
      (line) =>
        NPM_ERROR.test(line) &&
        !NPM_EMPTY_ERROR.test(line) &&
        !NPM_LOG_POINTER.test(line),
    )
    .map((line) => line.replace(NPM_ERROR, "").replace(/\s+/g, " "));
  if (npmErrors.length > 0) {
    return npmErrors.slice(0, maxLines).join(" | ");
  }
  const otherLines = lines.filter((line) => !NPM_NOISE.test(line));
  return (otherLines.length > 0 ? otherLines : lines)
    .slice(0, maxLines)
    .join(" | ");
};

export const execWait = async (
  command: string,
  cwd = ".",
  verbose = false,
  silent = false,
) => {
  if (verbose) {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, {
        cwd,
        shell: true,
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code ?? "unknown"}`));
        }
      });
    });
    return;
  }

  try {
    const { stdout, stderr } = await exec(command, { cwd });
    if (!silent) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }
  } catch (error) {
    const stdout =
      typeof error === "object" &&
        error !== null &&
        "stdout" in error &&
        typeof error.stdout === "string"
        ? error.stdout
        : "";
    const stderr =
      typeof error === "object" &&
        error !== null &&
        "stderr" in error &&
        typeof error.stderr === "string"
        ? error.stderr
        : "";
    if (verbose) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
    }
    const details = summarizeStderr(stderr);
    throw new Error(
      details || (error instanceof Error ? error.message : String(error)),
    );
  }
};
