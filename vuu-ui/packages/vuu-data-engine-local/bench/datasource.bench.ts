/**
 * Compares the engine backed ModuleDataSource (this package) with the legacy
 * ArrayDataSource based TickingArrayDataSource (@vuu-ui/vuu-data-test) on the
 * same scenarios. Run with `npm run bench:data-engine`.
 *
 * requestAnimationFrame is made synchronous so that every measurement includes
 * the work needed to deliver rows to the client, not just to compute them.
 * Row count can be set with BENCH_ROWS (default 100_000).
 *
 * Note: on table updates the legacy implementation does not re-sort or
 * re-filter rows, the engine does. test/LegacyParity.test.ts verifies both
 * produce the same results for the config (sort/filter/groupBy) scenarios.
 */
import type {
  DataSourceSubscribeCallback,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import {
  buildDataColumnMapFromSchema as buildLegacyDataMap,
  TickingArrayDataSource as LegacyDataSource,
  Table as LegacyTable,
} from "@vuu-ui/vuu-data-test";
import { Range } from "@vuu-ui/vuu-utils";
import { bench, describe } from "vitest";
import { ModuleDataSource } from "../src/ModuleDataSource";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";

globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  callback(0);
  return 0;
};
// legacy ArrayDataSource logs from its update path, keep I/O out of timings
console.log = () => undefined;

const ROWS = Number(process.env.BENCH_ROWS ?? 100_000);
const VIEWPORT = 50;
const BATCH = 1_000;

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "ccy", serverDataType: "string" },
    { name: "exchange", serverDataType: "string" },
    { name: "side", serverDataType: "string" },
    { name: "trader", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "qty", serverDataType: "int" },
    { name: "filled", serverDataType: "int" },
    { name: "created", serverDataType: "long" },
  ],
  key: "id",
  table: { module: "BENCH", table: "orders" },
};

const CCY = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "SEK"];
const EXCHANGE = ["XLON", "XNYS", "XPAR", "XETR", "XAMS", "XTKS"];
const SIDE = ["BUY", "SELL"];
const TRADER = Array.from({ length: 40 }, (_, i) => `trader${i}`);

// deterministic PRNG (mulberry32) so both implementations see identical data
const createRandom =
  (seed = 42) =>
  () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

type Row = [
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  number,
];

const createRow = (id: number, random: () => number): Row => [
  `id-${id}`,
  CCY[Math.floor(random() * CCY.length)],
  EXCHANGE[Math.floor(random() * EXCHANGE.length)],
  SIDE[Math.floor(random() * SIDE.length)],
  TRADER[Math.floor(random() * TRADER.length)],
  Math.round(random() * 100_000) / 100,
  Math.floor(random() * 10_000),
  Math.floor(random() * 10_000),
  1_700_000_000_000 + id,
];

const createData = (count = ROWS) => {
  const random = createRandom();
  return Array.from({ length: count }, (_, i) => createRow(i, random));
};

interface BenchTable {
  insert: (row: Row) => void;
  update: (key: string, column: string, value: number) => void;
  delete: (key: string) => void;
}

interface BenchDataSource {
  sort: unknown;
  filter: unknown;
  groupBy: unknown;
  range: unknown;
  readonly size: number;
  subscribe: (
    props: { range: ReturnType<typeof Range> },
    callback: DataSourceSubscribeCallback,
  ) => unknown;
  unsubscribe: () => void;
}

interface Fixture {
  table: BenchTable;
  dataSource: BenchDataSource;
  nextId: number;
  liveKeys: string[];
  random: () => number;
}

interface Implementation {
  name: string;
  create: (data: Row[]) => { table: BenchTable; dataSource: BenchDataSource };
}

const implementations: Implementation[] = [
  {
    name: "legacy TickingArrayDataSource",
    create: (data) => {
      const table = new LegacyTable(schema, data, buildLegacyDataMap(schema));
      const dataSource = new LegacyDataSource({
        columnDescriptors: schema.columns,
        table,
      });
      return {
        table: table as unknown as BenchTable,
        dataSource: dataSource as unknown as BenchDataSource,
      };
    },
  },
  {
    name: "engine ModuleDataSource",
    create: (data) => {
      const table = new Table(
        schema,
        data,
        buildDataColumnMapFromSchema(schema),
      );
      const dataSource = new ModuleDataSource({
        columnDescriptors: schema.columns,
        table,
      });
      return {
        table: table as unknown as BenchTable,
        dataSource: dataSource as unknown as BenchDataSource,
      };
    },
  },
];

// one microtask lets the engine flush coalesced table changes; the legacy
// implementation delivers synchronously, so this is a no-op for it
const settle = () => Promise.resolve();

const noop = () => undefined;

const createFixture = async (impl: Implementation) => {
  const data = createData();
  const { table, dataSource } = impl.create(data);
  const fixture: Fixture = {
    table,
    dataSource,
    nextId: data.length,
    liveKeys: data.map((row) => row[0]),
    random: createRandom(7),
  };
  await dataSource.subscribe({ range: Range(0, VIEWPORT) }, noop);
  await settle();
  return fixture;
};

/**
 * Registers one bench per implementation inside the enclosing describe, so
 * vitest reports the relative speed of the two implementations.
 */
const compare = (
  run: (fixture: Fixture, iteration: number) => void | Promise<void>,
  prepare?: (fixture: Fixture) => void,
) => {
  for (const impl of implementations) {
    let fixture: Fixture | undefined;
    let iteration = 0;
    bench(
      impl.name,
      async () => {
        if (fixture) {
          await run(fixture, iteration++);
        }
      },
      {
        setup: async () => {
          fixture?.dataSource.unsubscribe();
          fixture = await createFixture(impl);
          prepare?.(fixture);
          await settle();
          iteration = 0;
        },
        teardown: () => {
          fixture?.dataSource.unsubscribe();
          fixture = undefined;
        },
      },
    );
  }
};

const tick = async (fixture: Fixture, inViewport: boolean) => {
  const { liveKeys, random, table } = fixture;
  for (let i = 0; i < BATCH; i++) {
    const index = Math.floor(
      random() * (inViewport ? VIEWPORT : liveKeys.length),
    );
    table.update(
      liveKeys[index],
      "price",
      Math.round(random() * 100_000) / 100,
    );
  }
  await settle();
};

const churn = async (fixture: Fixture) => {
  const { liveKeys, random, table } = fixture;
  for (let i = 0; i < BATCH / 2; i++) {
    const index = Math.floor(random() * liveKeys.length);
    const key = liveKeys[index];
    liveKeys[index] = liveKeys[liveKeys.length - 1];
    liveKeys.pop();
    table.delete(key);
  }
  for (let i = 0; i < BATCH / 2; i++) {
    const row = createRow(fixture.nextId++, random);
    liveKeys.push(row[0]);
    table.insert(row);
  }
  await settle();
};

const sortByPrice = (fixture: Fixture) => {
  fixture.dataSource.sort = { sortDefs: [{ column: "price", sortType: "A" }] };
};

const sharedData = createData();

describe(`create + subscribe (${ROWS} rows)`, () => {
  for (const impl of implementations) {
    bench(impl.name, async () => {
      const { dataSource } = impl.create(sharedData);
      await dataSource.subscribe({ range: Range(0, VIEWPORT) }, noop);
      await settle();
      dataSource.unsubscribe();
    });
  }
});

describe(`sort numeric column, toggle asc/desc (${ROWS} rows)`, () => {
  compare((fixture, i) => {
    fixture.dataSource.sort = {
      sortDefs: [{ column: "price", sortType: i % 2 === 0 ? "A" : "D" }],
    };
  });
});

describe(`sort two columns (${ROWS} rows)`, () => {
  compare((fixture, i) => {
    fixture.dataSource.sort = {
      sortDefs: [
        { column: "ccy", sortType: "A" },
        { column: "qty", sortType: i % 2 === 0 ? "A" : "D" },
      ],
    };
  });
});

describe(`filter, alternating (${ROWS} rows)`, () => {
  compare((fixture, i) => {
    fixture.dataSource.filter = {
      filter: i % 2 === 0 ? 'ccy = "EUR" and price > 500' : 'side = "BUY"',
    };
  });
});

describe(`groupBy ccy, set/clear (${ROWS} rows)`, () => {
  compare((fixture, i) => {
    fixture.dataSource.groupBy = i % 2 === 0 ? ["ccy"] : [];
  });
});

describe(`groupBy ccy + exchange, set/clear (${ROWS} rows)`, () => {
  compare((fixture, i) => {
    fixture.dataSource.groupBy = i % 2 === 0 ? ["ccy", "exchange"] : [];
  });
});

describe(`scroll, 100 range changes (${ROWS} rows)`, () => {
  compare((fixture) => {
    const step = Math.floor((fixture.dataSource.size - VIEWPORT) / 100);
    for (let i = 0; i < 100; i++) {
      fixture.dataSource.range = Range(i * step, i * step + VIEWPORT);
    }
    fixture.dataSource.range = Range(0, VIEWPORT);
  });
});

describe(`ticks, ${BATCH} updates to random rows (${ROWS} rows)`, () => {
  compare((fixture) => tick(fixture, false));
});

describe(`ticks, ${BATCH} updates to rows in viewport (${ROWS} rows)`, () => {
  compare((fixture) => tick(fixture, true));
});

describe(`ticks, ${BATCH} updates on sorted column (${ROWS} rows)`, () => {
  compare((fixture) => tick(fixture, false), sortByPrice);
});

describe(`ticks, ${BATCH} updates on filtered column (${ROWS} rows)`, () => {
  compare(
    (fixture) => tick(fixture, false),
    (fixture) => {
      fixture.dataSource.filter = { filter: "price > 500" };
    },
  );
});

describe(`ticks, ${BATCH} updates while grouped (${ROWS} rows)`, () => {
  compare(
    (fixture) => tick(fixture, false),
    (fixture) => {
      fixture.dataSource.groupBy = ["ccy"];
    },
  );
});

describe(`churn, ${BATCH / 2} deletes + ${BATCH / 2} inserts (${ROWS} rows)`, () => {
  compare(churn);
});

describe(`churn on sorted view, ${BATCH / 2} deletes + ${BATCH / 2} inserts (${ROWS} rows)`, () => {
  compare(churn, sortByPrice);
});
