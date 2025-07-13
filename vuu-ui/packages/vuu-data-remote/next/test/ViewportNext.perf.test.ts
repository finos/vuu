import { beforeAll, describe, expect, it } from "vitest";
import { MockClient } from "./MockClient";
import { makeDataSourceRows } from "./makeRows";
import { LoopingKeySet } from "./MockKeySet";

import dataService from "./MockDataService";
import { IKeySet } from "@vuu-ui/vuu-utils";

describe("Viewport", () => {
  beforeAll(() => {
    dataService.load(100000);
  });

  describe("simple set range", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ keys });
      const expectedResult = makeDataSourceRows(0, 10);
      client.subscribe();

      await expect
        .poll(() => client.data, { interval: 20 })
        .toEqual(expectedResult);
    });
  });

  describe("no data buffer, scroll forward quickly, one row at a time", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ keys });
      const expectedResult = makeDataSourceRows(10, 20, keys);
      await client.scrollForwardRows(1, 10);
      expect(client.data).toEqual(expectedResult);
    });
  });

  describe("bufferSize 10, scroll forward, one row at a time, repeat 10 times", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ bufferSize: 10, keys });
      const expectedResult = makeDataSourceRows(10, 20, keys);
      await client.scrollForwardRows(1, 10);
      expect(client.data).toEqual(expectedResult);
    });
  });

  describe("bufferSize 10, scroll forward quickly, 5 rows at a time repeat 10 times", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ bufferSize: 10, keys });
      const expectedResult = makeDataSourceRows(50, 60, keys);
      await client.scrollForwardRows(5, 10);
      expect(client.data).toEqual(expectedResult);
    });
  });

  describe("bufferSize 10, scroll forward quickly, 5 rows at a time repeat 10 times, latency 400ms", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ bufferSize: 10, keys, latency: 400 });
      const expectedResult = makeDataSourceRows(50, 60, keys);
      await client.scrollForwardRows(5, 10);
      expect(client.data).toEqual(expectedResult);
    });
  });

  describe("bufferSize 100, scroll forward quickly, 5 rows at a time repeat 10 times, latency 400ms", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ bufferSize: 100, keys, latency: 400 });
      const elapsedTime = await client.scrollForwardRows(5, 10);
      expect(client.data).toEqual(makeDataSourceRows(50, 60, keys));
      console.log(`10 times repeat took ${elapsedTime}ms`);
    });
  });

  describe("bufferSize 100, scroll forward quickly, 5 rows at a time repeat 10 times, interval 200ms, server latency 400ms", () => {
    it("THEN perf is good", async () => {
      const keys: IKeySet = new LoopingKeySet(10);
      const client = await MockClient({ bufferSize: 100, keys, latency: 400 });
      const expectedResult = makeDataSourceRows(50, 60, keys);
      await client.scrollForwardRows(5, 10, 200);
      expect(client.data).toEqual(expectedResult);
    });
  });

  describe("performance", () => {
    describe("bufferSize 100, scroll forward quickly, 5 rows at a time repeat 10 times, interval 0ms, server latency 0ms", () => {
      it("THEN perf is good", async () => {
        const keys: IKeySet = new LoopingKeySet(10);
        const client = await MockClient({ bufferSize: 100, keys });
        const expectedResult = makeDataSourceRows(50, 60, keys);
        const elapsedTime = await client.scrollForwardRows(5, 10, 0);
        expect(client.data).toEqual(expectedResult);
        console.log(`10 times repeat took ${elapsedTime}ms`);
      });
    });

    describe("bufferSize 100, scroll forward quickly, 5 rows at a time repeat 100 times, interval 0ms, server latency 0ms", () => {
      it("THEN perf is good", { timeout: 3000 }, async () => {
        const keys: IKeySet = new LoopingKeySet(10);
        const client = await MockClient({ bufferSize: 100, keys });
        const expectedResult = makeDataSourceRows(500, 510, keys);
        const elapsedTime = await client.scrollForwardRows(5, 100, 0);
        expect(client.data).toEqual(expectedResult);
        console.log(`100 times repeat took ${elapsedTime}ms`);
      });
    });

    describe("bufferSize 200, scroll forward quickly, 5 rows at a time repeat 1000 times, interval 0ms, server latency 0ms", () => {
      it("THEN perf is good", { timeout: 20000 }, async () => {
        const keys: IKeySet = new LoopingKeySet(10);
        const client = await MockClient({ bufferSize: 200, keys });
        const expectedResult = makeDataSourceRows(5000, 5010, keys);
        const elapsedTime = await client.scrollForwardRows(5, 1000, 0);
        expect(client.data).toEqual(expectedResult);
        console.log(
          `1000 times repeat, 5 rows per response,  took ${elapsedTime}ms`,
        );
      });
    });

    describe("bufferSize 200, scroll forward quickly, 10 rows at a time repeat 1000 times, interval 0ms, server latency 0ms", () => {
      it("THEN perf is good", { timeout: 20000 }, async () => {
        const keys = new LoopingKeySet(10);
        const client = await MockClient({ bufferSize: 200, keys });
        const expectedResult = makeDataSourceRows(10000, 10010, keys);
        const elapsedTime = await client.scrollForwardRows(10, 1000, 0);
        expect(client.data).toEqual(expectedResult);
        console.log(
          `1000 times repeat, 10 rows per response,  took ${elapsedTime}ms`,
        );
      });
    });
  });
});
