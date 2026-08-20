import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);

export const execWait = async (command: string, cwd = ".") => {
  try {
    const { stdout, stderr } = await exec(command, { cwd });
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  } catch (error) {
    const stderr =
      typeof error === "object" &&
      error !== null &&
      "stderr" in error &&
      typeof error.stderr === "string"
        ? error.stderr
        : "";
    const details = stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" | ");
    throw new Error(
      details || (error instanceof Error ? error.message : String(error)),
    );
  }
};
