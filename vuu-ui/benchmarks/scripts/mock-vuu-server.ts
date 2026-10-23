/**
 * Starts the mock Vuu server on its own, for working on remote scenarios in
 * bench:dev or from the DevTools console. Open the benchmark app with the
 * printed ?vuuServer= parameter.
 *
 *   npm run bench:mock-server
 */
import { startMockVuuServer } from "../runner/mock-vuu-server";

const port = Number(process.env.BENCH_MOCK_PORT ?? 8091);
const server = await startMockVuuServer(port);
console.log(`mock Vuu server at ${server.url}`);
console.log(
  `open the benchmark app with ?vuuServer=${encodeURIComponent(server.url)}`,
);
