import { act, createElement, type SyntheticEvent } from "react";
import { createRoot } from "react-dom/client";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  getColumnFilterOperator,
  getColumnFilterOperators,
  getDefaultColumnFilterOperator,
  normalizeColumnFilterValue,
} from "../src/column-filter/column-filter-utils";
import {
  useColumnFilter,
  type ColumnFilterHookProps,
} from "../src/column-filter/useColumnFilter";

const price: ColumnDescriptor = { name: "price", serverDataType: "double" };

describe("ColumnFilter operator options", () => {
  it.each([
    "int",
    "long",
    "double",
    "scaleddecimal6",
  ] as const)("defaults %s columns to comparisons", (serverDataType) => {
    expect(getColumnFilterOperators({ name: "value", serverDataType })).toEqual(
      ["=", "!=", ">", ">=", "<", "<="],
    );
  });

  it("uses comparison operators for temporal columns", () => {
    expect(
      getColumnFilterOperators({
        name: "time",
        serverDataType: "long",
        type: "time",
      }),
    ).toEqual(["=", "!=", ">", ">=", "<", "<="]);
  });

  it("defaults text and boolean columns without offering multi-value operators", () => {
    expect(
      getColumnFilterOperators({ name: "name", serverDataType: "string" }),
    ).toEqual(["=", "!=", "starts", "ends", "contains"]);
    expect(
      getColumnFilterOperators({ name: "flag", serverDataType: "boolean" }),
    ).toEqual(["=", "!="]);
  });

  it("preserves configured order and allows opt-in range operators", () => {
    const operators = getColumnFilterOperators(price, [
      ">",
      "between-inclusive",
      "=",
    ]);
    expect(operators).toEqual([">", "between-inclusive", "="]);
    expect(getDefaultColumnFilterOperator(operators)).toBe("=");
    expect(getDefaultColumnFilterOperator([">", "<"])).toBe(">");
    expect(getDefaultColumnFilterOperator(operators, "between-inclusive")).toBe(
      "between-inclusive",
    );
  });

  it("rejects empty, incompatible and unsupported selections", () => {
    expect(() => getColumnFilterOperators(price, [])).toThrow(
      "invalid operators",
    );
    expect(() => getColumnFilterOperators(price, ["contains"])).toThrow(
      "invalid operators",
    );
    expect(() =>
      getColumnFilterOperators({ name: "name", serverDataType: "string" }, [
        "between",
      ]),
    ).toThrow("invalid operators");
    expect(() => getDefaultColumnFilterOperator(["="], ">")).toThrow(
      "not in the configured",
    );
    expect(() => getColumnFilterOperators({ name: "unknown" })).toThrow(
      "unsupported column type",
    );
  });

  it("restores a column's operator from a composite filter", () => {
    expect(
      getColumnFilterOperator(price, {
        op: "and",
        filters: [
          { column: "name", op: "contains", value: "a" },
          {
            op: "and",
            filters: [
              { column: "price", op: ">=", value: 10 },
              { column: "price", op: "<=", value: 20 },
            ],
          },
        ],
      }),
    ).toBe("between-inclusive");
    expect(
      getColumnFilterOperator(price, { column: "price", op: ">", value: 10 }),
    ).toBe(">");
    expect(
      getColumnFilterOperator(price, { column: "other", op: "=", value: 10 }),
    ).toBeUndefined();
  });

  it("normalizes values when crossing between single-value and range operators", () => {
    expect(normalizeColumnFilterValue("between", 10)).toEqual(["10", ""]);
    expect(normalizeColumnFilterValue("between")).toEqual(["", ""]);
    expect(normalizeColumnFilterValue(">", ["10", "20"])).toBe("10");
    expect(
      normalizeColumnFilterValue("between-inclusive", ["10", "20"]),
    ).toEqual(["10", "20"]);
  });
});

const event = {} as SyntheticEvent;
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
afterAll(() => vi.unstubAllGlobals());
let cleanup: (() => void) | undefined;
afterEach(() => cleanup?.());

const renderHook = (props: ColumnFilterHookProps) => {
  const container = document.createElement("div");
  const root = createRoot(container);
  let result: ReturnType<typeof useColumnFilter>;
  const Component = (props: ColumnFilterHookProps) => {
    result = useColumnFilter(props);
    return null;
  };
  const render = (props: ColumnFilterHookProps) => {
    act(() => root.render(createElement(Component, props)));
  };
  render(props);
  cleanup = () => act(() => root.unmount());
  return {
    get current() {
      return result;
    },
    render,
  };
};

describe("ColumnFilter operator state", () => {
  it("keeps the picker opt-in without validating options for fixed filters", () => {
    const hook = renderHook({
      column: price,
      operator: "between",
      defaultValue: ["10", "20"],
      operators: [],
      onCommit: vi.fn(),
    });
    expect(hook.current.operators).toBeUndefined();
    expect(hook.current.operator).toBe("between");
  });

  it("changes an uncontrolled operator and commits its existing value", () => {
    const onCommit = vi.fn();
    const onOperatorChange = vi.fn();
    const hook = renderHook({
      column: price,
      defaultValue: "10",
      onCommit,
      onOperatorChange,
      showOperatorPicker: true,
    });
    act(() => hook.current.onOperatorSelect(event, ">"));
    expect(hook.current.operator).toBe(">");
    expect(onOperatorChange).toHaveBeenCalledWith(event, ">");
    expect(onCommit).toHaveBeenCalledWith(price, ">", "10", undefined);
    act(() => hook.current.onOperatorSelect(event, ">"));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not commit an empty value", () => {
    const onCommit = vi.fn();
    const hook = renderHook({
      column: price,
      defaultValue: "",
      onCommit,
      showOperatorPicker: true,
    });
    act(() => hook.current.onOperatorSelect(event, "!="));
    expect(hook.current.operator).toBe("!=");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("clears an upper-only range when switching back to a scalar operator", () => {
    const onCommit = vi.fn();
    const hook = renderHook({
      column: price,
      defaultValue: ["", "20"],
      defaultOperator: "between",
      operators: ["=", "between"],
      onCommit,
      showOperatorPicker: true,
    });
    act(() => hook.current.onOperatorSelect(event, "="));
    expect(hook.current.InputProps.inputProps?.value).toBe("");
    expect(onCommit).toHaveBeenCalledWith(price, "=", "", undefined);
  });

  it("retains the lower value when switching to and from a range", () => {
    const onCommit = vi.fn();
    const hook = renderHook({
      column: price,
      defaultValue: "10",
      onCommit,
      operators: ["=", "between", ">"],
      showOperatorPicker: true,
    });
    act(() => hook.current.onOperatorSelect(event, "between"));
    expect(hook.current.InputProps.inputProps?.value).toBe("10");
    expect(hook.current.InputPropsRange.inputProps?.value).toBe("");
    expect(onCommit).toHaveBeenLastCalledWith(
      price,
      "between",
      ["10", ""],
      undefined,
    );
    act(() => hook.current.onCommitRange(event, "20"));
    expect(onCommit).toHaveBeenLastCalledWith(
      price,
      "between",
      ["10", "20"],
      undefined,
    );
    act(() => hook.current.onOperatorSelect(event, ">"));
    expect(hook.current.InputProps.inputProps?.value).toBe("10");
    expect(onCommit).toHaveBeenLastCalledWith(price, ">", "10", undefined);
  });

  it("respects controlled operator updates without maintaining a second selection", () => {
    const props: ColumnFilterHookProps = {
      column: price,
      value: "10",
      operator: "=",
      onCommit: vi.fn(),
      showOperatorPicker: true,
    };
    const hook = renderHook(props);
    act(() => hook.current.onOperatorSelect(event, ">"));
    expect(hook.current.operator).toBe("=");
    hook.render({ ...props, operator: "<", value: "20" });
    expect(hook.current.operator).toBe("<");
    expect(hook.current.InputProps.inputProps?.value).toBe("20");
  });

  it("clears invalid time-range state on an external scalar-operator update", () => {
    const column: ColumnDescriptor = {
      name: "time",
      serverDataType: "long",
      type: "time",
    };
    const props: ColumnFilterHookProps = {
      column,
      operator: "between",
      value: ["12:00:00", "11:00:00"],
      operators: ["=", "between"],
      onCommit: vi.fn(),
      showOperatorPicker: true,
    };
    const hook = renderHook(props);
    expect(hook.current.isInvalid).toBe(true);
    hook.render({ ...props, operator: "=" });
    expect(hook.current.isInvalid).toBe(false);
    expect(hook.current.InputProps.inputProps?.value).toBe("12:00:00");
  });
});
