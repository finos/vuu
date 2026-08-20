import { exec as execCallback, spawn } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);

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
