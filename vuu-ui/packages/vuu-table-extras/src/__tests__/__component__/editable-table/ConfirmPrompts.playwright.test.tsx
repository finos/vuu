import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../../playwright/fixtures";

const EXAMPLES = "DataEditing/EditableTable";

const editableTable = (page: Page) => page.getByTestId("edit-table");
const submitPrompt = (page: Page) => page.getByTestId("confirm-submit");
const discardPrompt = (page: Page) => page.getByTestId("confirm-discard");
const footerButton = (page: Page, name: string) =>
  editableTable(page).getByRole("button", { exact: true, name });

const startEditing = async (page: Page, description: string) => {
  await page.getByRole("radio", { name: "Edit" }).click();
  const textbox = page.getByRole("textbox", { name: "description" }).first();
  await textbox.fill(description);
  await textbox.press("Enter");
  await expect(footerButton(page, "Save")).toBeEnabled();
};

const expectMode = (page: Page, mode: "edit" | "view") =>
  expect(editableTable(page)).toHaveClass(
    new RegExp(`vuuEditableTableContainer-${mode}`),
  );

test.describe("EditableTableContainer confirmation Prompts", () => {
  test("Save shows the changed rows, read only; Cancel keeps editing", async ({
    mount,
    page,
  }) => {
    await mount(`${EXAMPLES}/ConfirmPrompts`);
    await startEditing(page, "Confirm me");
    await footerButton(page, "Save").click();

    const prompt = submitPrompt(page);
    await expect(prompt).toContainText("Submit changes");
    await expect(prompt).toContainText(
      "Are you sure you want to change the following instruments",
    );
    await expect(prompt.locator('[data-icon="info-circle"]')).toHaveCount(1);
    const rows = prompt
      .getByRole("row")
      .filter({ has: page.getByRole("cell") });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Confirm me");
    await expect(prompt.getByRole("textbox")).toHaveCount(0);

    await prompt.getByRole("button", { name: "Cancel" }).click();
    await expect(prompt).toHaveCount(0);
    await expectMode(page, "edit");
    await expect(footerButton(page, "Save")).toBeEnabled();
  });

  test("Confirm saves the changes", async ({ mount, page }) => {
    await mount(`${EXAMPLES}/ConfirmPrompts`);
    await startEditing(page, "Confirmed");
    await footerButton(page, "Save").click();

    await submitPrompt(page).getByRole("button", { name: "Confirm" }).click();
    await expect(submitPrompt(page)).toHaveCount(0);
    await expectMode(page, "view");
    await expect(
      page.getByRole("row").filter({ hasText: "Confirmed" }),
    ).toHaveCount(1);
  });

  test("Cancel with unsaved changes asks before discarding them", async ({
    mount,
    page,
  }) => {
    await mount(`${EXAMPLES}/ConfirmPrompts`);
    await startEditing(page, "Discard me");
    await footerButton(page, "Cancel").click();

    const prompt = discardPrompt(page);
    await expect(prompt).toContainText("Discard changes");
    await expect(prompt).toContainText(
      "All your changes will be lost. Do you want to discard changes and exit Edit mode ?",
    );
    await expect(prompt.locator('[data-icon="warn-triangle"]')).toHaveCount(1);

    await prompt.getByRole("button", { name: "Cancel" }).click();
    await expect(prompt).toHaveCount(0);
    await expectMode(page, "edit");

    await footerButton(page, "Cancel").click();
    await discardPrompt(page).getByRole("button", { name: "Confirm" }).click();
    await expectMode(page, "view");
    await expect(
      page.getByRole("row").filter({ hasText: "Discard me" }),
    ).toHaveCount(0);
  });

  test("Cancel without changes does not ask", async ({ mount, page }) => {
    await mount(`${EXAMPLES}/ConfirmPrompts`);
    await page.getByRole("radio", { name: "Edit" }).click();
    await expectMode(page, "edit");
    await page.getByRole("radio", { name: "View" }).click();
    await expectMode(page, "view");
    await expect(discardPrompt(page)).toHaveCount(0);
  });

  test("text, icons and columns can be changed", async ({ mount, page }) => {
    await mount(`${EXAMPLES}/ConfirmPromptsCustomised`);
    await startEditing(page, "Custom");

    await footerButton(page, "Save").click();
    const submit = submitPrompt(page);
    await expect(submit).toContainText("Update instruments");
    await expect(submit).toContainText("These instruments will be updated:");
    await expect(submit.locator('[data-icon="tick"]')).toHaveCount(1);
    await expect(
      submit.getByRole("columnheader").filter({ hasText: /\w/ }),
    ).toHaveText(["ric", "description", "currency", "lotSize"]);
    await submit.getByRole("button", { name: "Back" }).click();

    await footerButton(page, "Cancel").click();
    const discard = discardPrompt(page);
    await expect(discard).toContainText("Unsaved instruments");
    await expect(discard).toContainText(
      "Your edits to these instruments have not been saved.",
    );
    await expect(discard.locator('[data-icon="error"]')).toHaveCount(1);
    await discard.getByRole("button", { name: "Discard" }).click();
    await expectMode(page, "view");
  });

  test("both Prompts can be turned off", async ({ mount, page }) => {
    await mount(`${EXAMPLES}/NoConfirmPrompts`);
    await startEditing(page, "No prompt");
    await footerButton(page, "Cancel").click();
    await expectMode(page, "view");
    await expect(discardPrompt(page)).toHaveCount(0);

    await startEditing(page, "No prompt");
    await footerButton(page, "Save").click();
    await expectMode(page, "view");
    await expect(submitPrompt(page)).toHaveCount(0);
    await expect(
      page.getByRole("row").filter({ hasText: "No prompt" }),
    ).toHaveCount(1);
  });
});
