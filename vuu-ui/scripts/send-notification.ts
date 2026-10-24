/**
 * Send a notification to a local Vuu server (accepts self-signed certificates).
 *
 * Usage:
 *   node scripts/send-notification.ts --port 8443 --message "Hello from curl"
 *   node scripts/send-notification.ts --audience all --type toast --message "Hello"
 */
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const usage = `Usage: node scripts/send-notification.ts --message <message> [options]

Options:
  --port <port>          REST server port (default: 8443)
  --audience <audience>  Notification audience (default: all)
  --type <type>          Notification type (default: toast)
  --message <message>    Notification message (required)
  --help                Show this help
`;

try {
  const { values } = parseArgs({
    options: {
      port: { type: "string", default: "8443" },
      audience: { type: "string", default: "all" },
      type: { type: "string", default: "toast" },
      message: { type: "string" },
      help: { type: "boolean" },
    },
  });

  if (values.help) {
    console.log(usage);
  } else {
    const port = Number(values.port);
    if (!/^\d+$/.test(values.port) || port < 1 || port > 65535) {
      throw Error("--port must be an integer between 1 and 65535");
    }
    if (!values.message?.trim()) {
      throw Error("--message is required and must not be blank");
    }
    if (!values.audience.trim() || !values.type.trim()) {
      throw Error("--audience and --type must not be blank");
    }

    const result = spawnSync(
      "curl",
      [
        "-k",
        "--fail-with-body",
        "-X",
        "POST",
        `https://localhost:${port}/api/admin/notifications`,
        "-H",
        "Content-Type: application/json",
        "-d",
        JSON.stringify({
          title: "Test notification",
          message: values.message,
          level: "WARNING",
          type: values.type,
          audience: values.audience,
          durationMs: 15000,
        }),
      ],
      { stdio: "inherit" },
    );

    if (result.error) {
      throw result.error;
    }
    if (result.signal) {
      throw Error(`curl terminated by signal ${result.signal}`);
    }
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(
    `[send-notification] ${error instanceof Error ? error.message : String(error)}`,
  );
  console.error(usage);
  process.exitCode = 1;
}
