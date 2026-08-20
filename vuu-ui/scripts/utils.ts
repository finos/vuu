import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCallback);

export const execWait = async (command: string, cwd: string) => {
  const { stdout, stderr } = await exec(command, {
    cwd,
  });
  process.stdout.write(stdout);
  process.stderr.write(stderr);
};
