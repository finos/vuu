import { act, type MouseEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { useEditField } from "../src/edit-field/useEditField";
import type { LookupOption } from "../src/lookup-values/useLookupValues";

const SUCCESS = { data: undefined, type: "SUCCESS_RESULT" as const };

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = false;
});

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const DropdownField = ({ onEdit }: { onEdit: ReturnType<typeof vi.fn> }) => {
  const { onDropdownSelectionChange, value } = useEditField({
    column: { label: "Client", name: "client_id" },
    onEdit,
    value: "client-1",
  });

  return (
    <button
      onClick={(event: MouseEvent<HTMLButtonElement>) =>
        onDropdownSelectionChange(event, [
          { label: "New Client", value: "client-2" },
        ] satisfies LookupOption[])
      }
      type="button"
    >
      {value}
    </button>
  );
};

describe("useEditField dropdown selection", () => {
  it("commits the selected value through onEdit", async () => {
    const onEdit = vi.fn().mockResolvedValue(SUCCESS);

    await act(async () => root.render(<DropdownField onEdit={onEdit} />));
    const button = container.querySelector("button");
    expect(button?.textContent).toBe("client-1");

    await act(async () => button?.click());

    expect(onEdit).toHaveBeenCalledWith(
      {
        editType: "commit",
        isValid: true,
        previousValue: "client-1",
        value: "client-2",
      },
      "commit",
    );
    expect(button?.textContent).toBe("client-2");
  });
});
