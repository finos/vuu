import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { useMemo } from "react";

/**
 * Sample data used throughout the Table documentation. Each row is an
 * array of values, in the same order as the column descriptors.
 */
export const stockColumns: ColumnDescriptor[] = [
  { name: "ric", label: "RIC", serverDataType: "string", width: 90 },
  { name: "name", label: "Name", serverDataType: "string", width: 170 },
  { name: "sector", label: "Sector", serverDataType: "string", width: 110 },
  { name: "exchange", label: "Exchange", serverDataType: "string", width: 90 },
  { name: "currency", label: "Ccy", serverDataType: "string", width: 60 },
  { name: "price", label: "Price", serverDataType: "double", width: 90 },
  { name: "change", label: "Change", serverDataType: "double", width: 90 },
  { name: "volume", label: "Volume", serverDataType: "long", width: 110 },
  {
    name: "lastTrade",
    label: "Last trade",
    serverDataType: "epochtimestamp",
    width: 150,
  },
  { name: "esg", label: "ESG", serverDataType: "boolean", width: 60 },
];

const T = Date.UTC(2026, 8, 30, 15, 30);
const min = 60_000;

// prettier-ignore
export const stockData: VuuRowDataItemType[][] = [
  ["AAPL.OQ", "Apple Inc", "Technology", "NASDAQ", "USD", 227.52, 0.0124, 51_204_330, T - 1 * min, true],
  ["MSFT.OQ", "Microsoft Corp", "Technology", "NASDAQ", "USD", 438.11, -0.0042, 18_330_120, T - 2 * min, true],
  ["NVDA.OQ", "NVIDIA Corp", "Technology", "NASDAQ", "USD", 121.44, 0.0315, 302_118_400, T - 1 * min, false],
  ["AMZN.OQ", "Amazon.com Inc", "Consumer", "NASDAQ", "USD", 186.33, 0.0087, 40_118_900, T - 3 * min, false],
  ["GOOGL.OQ", "Alphabet Inc", "Technology", "NASDAQ", "USD", 165.85, -0.0113, 22_904_510, T - 2 * min, true],
  ["META.OQ", "Meta Platforms", "Technology", "NASDAQ", "USD", 572.44, 0.0198, 12_771_030, T - 4 * min, false],
  ["JPM.N", "JPMorgan Chase", "Financials", "NYSE", "USD", 210.86, 0.0021, 8_220_440, T - 5 * min, true],
  ["GS.N", "Goldman Sachs", "Financials", "NYSE", "USD", 495.12, -0.0077, 1_904_220, T - 7 * min, false],
  ["XOM.N", "Exxon Mobil", "Energy", "NYSE", "USD", 117.3, -0.0231, 15_009_800, T - 6 * min, false],
  ["CVX.N", "Chevron Corp", "Energy", "NYSE", "USD", 147.21, -0.0188, 7_310_660, T - 9 * min, false],
  ["JNJ.N", "Johnson & Johnson", "Healthcare", "NYSE", "USD", 162.07, 0.0034, 6_118_250, T - 8 * min, true],
  ["PFE.N", "Pfizer Inc", "Healthcare", "NYSE", "USD", 28.94, -0.0051, 33_870_120, T - 3 * min, true],
  ["KO.N", "Coca-Cola Co", "Consumer", "NYSE", "USD", 71.88, 0.0009, 10_402_330, T - 11 * min, true],
  ["VOD.L", "Vodafone Group", "Telecoms", "LSE", "GBP", 74.62, -0.0142, 68_118_200, T - 12 * min, true],
  ["HSBA.L", "HSBC Holdings", "Financials", "LSE", "GBP", 668.2, 0.0061, 21_604_700, T - 4 * min, false],
  ["BP.L", "BP plc", "Energy", "LSE", "GBP", 391.45, -0.0204, 30_221_090, T - 2 * min, false],
  ["SHEL.L", "Shell plc", "Energy", "LSE", "GBP", 2478.5, -0.0165, 9_880_430, T - 5 * min, false],
  ["AZN.L", "AstraZeneca", "Healthcare", "LSE", "GBP", 11840, 0.0112, 1_920_330, T - 6 * min, true],
  ["ULVR.L", "Unilever", "Consumer", "LSE", "GBP", 4812, 0.0047, 2_771_610, T - 13 * min, true],
  ["BARC.L", "Barclays", "Financials", "LSE", "GBP", 226.75, 0.0153, 41_002_880, T - 1 * min, false],
  ["SAP.DE", "SAP SE", "Technology", "XETRA", "EUR", 204.1, 0.0221, 1_603_990, T - 3 * min, true],
  ["SIE.DE", "Siemens AG", "Industrials", "XETRA", "EUR", 181.36, -0.0029, 1_208_770, T - 10 * min, true],
  ["ALV.DE", "Allianz SE", "Financials", "XETRA", "EUR", 291.5, 0.0018, 640_220, T - 14 * min, true],
  ["BAS.DE", "BASF SE", "Materials", "XETRA", "EUR", 47.62, -0.0096, 2_330_510, T - 9 * min, false],
  ["MC.PA", "LVMH", "Consumer", "Euronext", "EUR", 701.4, 0.0263, 510_380, T - 2 * min, false],
  ["AIR.PA", "Airbus SE", "Industrials", "Euronext", "EUR", 134.28, 0.0072, 1_102_640, T - 7 * min, true],
  ["TTE.PA", "TotalEnergies", "Energy", "Euronext", "EUR", 58.91, -0.0137, 4_418_020, T - 8 * min, false],
  ["SAN.MC", "Banco Santander", "Financials", "BME", "EUR", 4.61, 0.0095, 28_330_400, T - 15 * min, true],
  ["NESN.S", "Nestle SA", "Consumer", "SIX", "CHF", 86.74, -0.0018, 3_901_220, T - 11 * min, true],
  ["NOVN.S", "Novartis AG", "Healthcare", "SIX", "CHF", 98.33, 0.0056, 2_880_150, T - 12 * min, true],
];

const sectors = ["Technology", "Financials", "Energy", "Healthcare", "Consumer"];
const currencies = ["USD", "GBP", "EUR", "CHF", "JPY"];

/**
 * Generates a large, deterministic dataset, with the same columns as
 * stockData, to demonstrate virtualization.
 */
export const generateStockData = (count: number): VuuRowDataItemType[][] =>
  Array.from({ length: count }, (_, i) => [
    `SYM${String(i).padStart(6, "0")}.X`,
    `Generated Company ${i}`,
    sectors[i % sectors.length],
    "TEST",
    currencies[i % currencies.length],
    10 + ((i * 7919) % 100_000) / 100,
    (((i * 104_729) % 2001) - 1000) / 25_000,
    (i * 15_485_863) % 50_000_000,
    T - (i % 600) * min,
    i % 3 === 0,
  ]);

type ArrayDataSourceOptions = ConstructorParameters<typeof ArrayDataSource>[0];

/**
 * Creates a memoised ArrayDataSource over the sample stock data. Used by
 * most documentation examples, so that the code shown can focus on the
 * Table feature being described.
 */
export const useStockDataSource = (
  options: Partial<ArrayDataSourceOptions> = {},
) =>
  // biome-ignore lint/correctness/useExhaustiveDependencies: options are only read on first render
  useMemo(
    () =>
      new ArrayDataSource({
        columnDescriptors: stockColumns,
        data: stockData,
        keyColumn: "ric",
        ...options,
      }),
    [],
  );
