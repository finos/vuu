import { describe, expect, it } from "vitest";
import { filterAsReactNode } from "../../src/filter-pill/filterAsReactNode";
import {
  MultiClauseFilter,
  MultiValueFilterClause,
} from "@finos/vuu-filter-types";

describe("filterAsReactNode", () => {
  it("can get correct node for a single value filter", () => {
    const f = { op: "=", column: "isSupported", value: true } as const;
    const res = filterAsReactNode(f);
    expect(res).toEqual("isSupported = true");
  });

  it("can get correct node for a multi value filter with length <= 3", () => {
    const f: MultiValueFilterClause = {
      op: "in",
      column: "name",
      values: ["vuu", "finos", "foo"],
    };
    const res = filterAsReactNode(f);
    expect(res).toEqual('name in ["vuu","finos","foo"]');
  });

  it("can get correct node for a multi value filter with length > 3", () => {
    const f: MultiValueFilterClause = {
      op: "in",
      column: "name",
      values: ["vuu", "finos", "foo", "bar"],
    };
    const res = filterAsReactNode(f);
    expect(res).toEqual('name in ["vuu","finos","foo",...]');
  });

  it("can get correct node for a multi clause `and` filter", () => {
    const f: MultiClauseFilter = {
      op: "and",
      filters: [
        {
          op: "in",
          column: "name",
          values: ["vuu", "finos", "foo", "bar"],
        },
        { op: ">", value: 0, column: "threshold" },
      ],
    };
    const res = filterAsReactNode(f);
    expect(res).toMatchInlineSnapshot(`
      <ul>
        <span>
          Match all ...
        </span>
        <li>
          name in ["vuu","finos","foo",...]
        </li>
        <li>
          threshold &gt; 0
        </li>
      </ul>
    `);
  });

  it("can get correct node for a multi clause `or` filter", () => {
    const f: MultiClauseFilter = {
      op: "or",
      filters: [
        { op: "starts", value: "A", column: "city" },
        { op: ">", value: 0, column: "threshold" },
      ],
    };
    const res = filterAsReactNode(f);
    expect(res).toMatchInlineSnapshot(`
      <ul>
        <span>
          Match any ...
        </span>
        <li>
          city starts "A"
        </li>
        <li>
          threshold &gt; 0
        </li>
      </ul>
    `);
  });

  it("can get correct node for a nested multi clause filter", () => {
    const f: MultiClauseFilter = {
      op: "or",
      filters: [
        { op: "starts", value: "A", column: "city" },
        {
          op: "and",
          filters: [
            { op: ">", value: 0, column: "threshold" },
            { op: "<", value: 10, column: "threshold" },
          ],
        },
      ],
    };
    const res = filterAsReactNode(f);
    expect(res).toMatchInlineSnapshot(`
      <ul>
        <span>
          Match any ...
        </span>
        <li>
          city starts "A"
        </li>
        <li>
          <ul>
            <span>
              Match all ...
            </span>
            <li>
              threshold &gt; 0
            </li>
            <li>
              threshold &lt; 10
            </li>
          </ul>
        </li>
      </ul>
    `);
  });
});
