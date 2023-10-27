import { describe, expect, it } from "vitest";
import { jsonToDataSourceRows } from "../src/json-utils";

describe("jsonToDataSourceRows", () => {
  it("parses a property list (simple name value pairs)", () => {
    // prettier-ignore
    expect(
      jsonToDataSourceRows({
        test1: "value 1",
        test2: 12345,
        test3: 100.01,
        test4: true,
      })
    ).toEqual([[
        {name: 'col 1', type: {name: "json", "renderer": {name: "json"}}}, 
        {name: "col 2", type: {name: "json", "renderer": {name: "json"}}}
    ], 
    [
        [0, 0, true, false, 0, 0, "$root|test1", 0, "test1", "value 1"],
        [1, 1, true, false, 0, 0, "$root|test2", 0, "test2", 12345],
        [2, 2, true, false, 0, 0, "$root|test3", 0, "test3", 100.01],
        [3, 3, true, false, 0, 0, "$root|test4", 0, "test4", true],
    ]]);
  });

  it("parses a 2 level structure, mixed simple attributes and json", () => {
    // prettier-ignore
    expect(
      jsonToDataSourceRows({
        test1: "value 1",
        test2: 12345,
        test3: 100.01,
        test4: true,
        test5: {
            "test5.1": "test 5.1 value",
            "test5.2": "test 5.2 value"
        }
      })
    ).toEqual([[
        {name: 'col 1', type: {name: "json", "renderer": {name: "json"}}}, 
        {name: "col 2", type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 3", hidden: true, type: {name: "json", "renderer": {name: "json"}}}
    ], 
    [
        [0, 0, true, false, 0, 0, "$root|test1", 0, "test1", "value 1"],
        [1, 1, true, false, 0, 0, "$root|test2", 0, "test2", 12345],
        [2, 2, true, false, 0, 0, "$root|test3", 0, "test3", 100.01],
        [3, 3, true, false, 0, 0, "$root|test4", 0, "test4", true],
        [4, 4, false, false, 0, 2, "$root|test5", 0, "test5+", ""],
        [5, 5, true, false, 1, 0, "$root|test5|test5.1", 0, "", "test5.1", "test 5.1 value"],
        [6, 6, true, false, 1, 0, "$root|test5|test5.2", 0, "", "test5.2", "test 5.2 value"],
    ]]);
  });

  it("parses a 3 level structure, mixed simple attributes and json", () => {
    // prettier-ignore
    expect(
      jsonToDataSourceRows({
        test1: "value 1",
        test2: 12345,
        test3: 100.01,
        test4: true,
        test5: {
            "test5.1": "test 5.1 value",
            "test5.2": {
                "test5.2.1": "test 5.2.1 value",
                "test5.2.2": "test 5.2.2 value"
            },
            "test5.3": "test 5.3 value"
        },
        test6: {
            "test6.1": "test 6.1 value",
            "test6.2": "test 6.2 value"
        }
      })
    ).toEqual([[
        {name: 'col 1', type: {name: "json", "renderer": {name: "json"}}}, 
        {name: "col 2", type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 3", hidden: true, type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 4", hidden: true, type: {name: "json", "renderer": {name: "json"}}}
    ], 
    [
        [0, 0, true, false, 0, 0, "$root|test1", 0, "test1", "value 1"],
        [1, 1, true, false, 0, 0, "$root|test2", 0, "test2", 12345],
        [2, 2, true, false, 0, 0, "$root|test3", 0, "test3", 100.01],
        [3, 3, true, false, 0, 0, "$root|test4", 0, "test4", true],
        [4, 4, false, false, 0, 4, "$root|test5", 0, "test5+", ""],
        [5, 5, true, false, 1, 0, "$root|test5|test5.1", 0, "", "test5.1", "test 5.1 value"],
        [6, 6, false, false, 1, 2, "$root|test5|test5.2", 0, "", "test5.2+", ""],
        [7, 7, true, false, 2, 0, "$root|test5|test5.2|test5.2.1", 0, "", "", "test5.2.1", "test 5.2.1 value"],
        [8, 8, true, false, 2, 0, "$root|test5|test5.2|test5.2.2", 0, "", "", "test5.2.2", "test 5.2.2 value"],
        [9, 9, true, false, 1, 0, "$root|test5|test5.3", 0, "", "test5.3", "test 5.3 value"],
        [10, 10, false, false, 0, 2, "$root|test6", 0, "test6+", ""],
        [11, 11, true, false, 1, 0, "$root|test6|test6.1", 0, "", "test6.1", "test 6.1 value"],
        [12, 12, true, false, 1, 0, "$root|test6|test6.2", 0, "", "test6.2", "test 6.2 value"],
    ]]);
  });

  it("parses a 3 level structure, all json structure", () => {
    // prettier-ignore
    expect(
      jsonToDataSourceRows({
        test5: {
            "test5.1": "test 5.1 value",
            "test5.2": "test 5.2 value"
        },
        test6: {
            "test6.1": "test 6.1 value",
            "test6.2": "test 6.2 value"
        }
      })
    ).toEqual([[
        {name: 'col 1', type: {name: "json", "renderer": {name: "json"}}}, 
        {name: "col 2", type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 3", hidden: true, type: {name: "json", "renderer": {name: "json"}}},
    ], 
    [
        [0, 0, false, false, 0, 2, "$root|test5", 0, "test5+", ""],
        [1, 1, true, false, 1, 0, "$root|test5|test5.1", 0, "", "test5.1", "test 5.1 value"],
        [2, 2, true, false, 1, 0, "$root|test5|test5.2", 0, "", "test5.2", "test 5.2 value"],
        [3, 3, false, false, 0, 2, "$root|test6", 0, "test6+", ""],
        [4, 4, true, false, 1, 0, "$root|test6|test6.1", 0, "", "test6.1", "test 6.1 value"],
        [5, 5, true, false, 1, 0, "$root|test6|test6.2", 0, "", "test6.2", "test 6.2 value"],
    ]]);
  });

  it("parses a 2 level structure, mixed simple attributes and array (simple values)", () => {
    // prettier-ignore

    expect(
      jsonToDataSourceRows({
        test1: "value 1",
        test2: 12345,
        test3: 100.01,
        test4: true,
        test5: ["test5.1", "test5.2", "test5.3"],
      })
    ).toEqual([
      [
        { name: "col 1", type: { name: "json", renderer: { name: "json" } } },
        { name: "col 2", type: { name: "json", renderer: { name: "json" } } },
        {
          name: "col 3",
          hidden: true,
          type: { name: "json", renderer: { name: "json" } },
        },
      ],
      [
        [0, 0, true, false, 0, 0, "$root|test1", 0, "test1", "value 1"],
        [1, 1, true, false, 0, 0, "$root|test2", 0, "test2", 12345],
        [2, 2, true, false, 0, 0, "$root|test3", 0, "test3", 100.01],
        [3, 3, true, false, 0, 0, "$root|test4", 0, "test4", true],
        [4, 4, false, false, 0, 3, "$root|test5", 0, "test5+", ""],
        [5, 5, true, false, 1, 0, "$root|test5|0", 0, "", "0", "test5.1"],
        [6, 6, true, false, 1, 0, "$root|test5|1", 0, "", "1", "test5.2"],
        [7, 7, true, false, 1, 0, "$root|test5|2", 0, "", "2", "test5.3"],
      ],
    ]);
  });

  it("parses a 2 level structure, mixed simple attributes and array (json values)", () => {
    // prettier-ignore
    expect(
      jsonToDataSourceRows({
        test1: "value 1",
        test2: 12345,
        test3: 100.01,
        test4: true,
        test5: [
            {"test5.1": "test 5.1 value"},
            {"test5.2": "test 5.2 value"},
            {"test5.3": "test 5.2 value"}
        ],
        
        
      })
    // prettier-ignore
    ).toEqual([[
        {name: 'col 1', type: {name: "json", "renderer": {name: "json"}}}, 
        {name: "col 2", type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 3", hidden: true, type: {name: "json", "renderer": {name: "json"}}},
        {name: "col 4", hidden: true, type: {name: "json", "renderer": {name: "json"}}}
    ], 
    [
        [0, 0, true, false, 0, 0, "$root|test1", 0, "test1", "value 1"],
        [1, 1, true, false, 0, 0, "$root|test2", 0, "test2", 12345],
        [2, 2, true, false, 0, 0, "$root|test3", 0, "test3", 100.01],
        [3, 3, true, false, 0, 0, "$root|test4", 0, "test4", true],
        [4, 4, false, false, 0, 3, "$root|test5", 0, "test5+", ""],
        [5, 5, false, false, 1, 1, '$root|test5|0', 0, '', '0+', '' ],
        [6, 6, true, false,  2, 0, '$root|test5|0|test5.1', 0, '', '', 'test5.1', 'test 5.1 value' ],
        [7, 7, false, false, 1, 1, '$root|test5|1', 0, '', '1+', '' ],
        [8,8, true, false, 2, 0, '$root|test5|1|test5.2', 0, '', '', 'test5.2','test 5.2 value'],
        [9, 9, false, false, 1, 1, '$root|test5|2', 0, '', '2+', '' ],
        [10,10, true,false, 2, 0, '$root|test5|2|test5.3', 0, '', '', 'test5.3', 'test 5.2 value']
      ]
    ]);
  });
});
