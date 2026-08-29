import { expect, type Locator, test } from "../../../../../../playwright/fixtures";


interface DisplayedItem {
  dataName: string;
  displayLabel: string;
}

test.describe("ItemPicker", () => {
  test.describe("Component tests", () => {
    test.describe("WHEN supplied with empty allItems", () => {
      test("THEN heading and sub-headings are rendered with no items in the selected or available lists", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount("UiControls/ItemPicker/EmptyItemPicker");

        await expectSearchControlWithPlaceholderText(component, "Find pay day");
        await expectListHeadings(
          component,
          "0 pay days in view",
          "0 available pay days",
        );
        await expectSelectedItems(component, 0);
        await expectAvailableItems(component, 0);
      });
    });

    test.describe("WHEN supplied with items", () => {
      test("THEN selected items are initially displayed ordered according to selectedItems prop", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await expectListHeadings(
          component,
          "10 columns in view",
          "8 available columns",
        );
        await expectSelectedItems(component, 10, [
          { dataName: "account", displayLabel: "account" },
          { dataName: "algo", displayLabel: "algo" },
          { dataName: "averagePrice", displayLabel: "Average price" },
          { dataName: "ccy", displayLabel: "ccy" },
          { dataName: "childCount", displayLabel: "Child count" },
          { dataName: "exchange", displayLabel: "exchange" },
          { dataName: "filledQty", displayLabel: "filledQty" },
          { dataName: "id", displayLabel: "id" },
          { dataName: "idAsInt", displayLabel: "idAsInt" },
          { dataName: "openQty", displayLabel: "openQty" },
        ]);
      });

      test.skip("THEN selected items can be reordered via drag and drop", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await dragAndDropSelectedItemAboveAnother(
          page,
          component,
          8,
          "id",
          1,
          "account",
        );

        let selectedList = component.locator(".vuuItemPicker-selectedList");
        const firstRow = selectedList.locator(".vuuItemPickerListItem").nth(0);
        await expect(firstRow).toContainText("id");

        await dragAndDropSelectedItemBelowAnother(
          page,
          component,
          8,
          "filledQty",
          10,
          "openQty",
        );

        selectedList = component.locator(".vuuItemPicker-selectedList");
        const totalRows = await selectedList
          .locator(".vuuItemPickerListItem")
          .count();
        const lastRow = selectedList
          .locator(".vuuItemPickerListItem")
          .nth(totalRows - 1);
        await expect(lastRow).toContainText("filledQty");
      });

      test("THEN selected and available items can be searched by sub-string (non case-sensitive)", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await typeSearchText(component, "QTY");
        await expectListHeadings(
          component,
          "10 columns in view",
          "8 available columns",
        );
        await expectSelectedItems(component, 2, [
          { dataName: "filledQty", displayLabel: "filledQty" },
          { dataName: "openQty", displayLabel: "openQty" },
        ]);
        await expectAvailableItems(component, 0, [], true);

        await typeSearchText(component, "tImEStAmP");
        await expectListHeadings(
          component,
          "10 columns in view",
          "8 available columns",
        );
        await expectSelectedItems(component, 0, []);
        await expectAvailableItems(
          component,
          2,
          [
            {
              dataName: "vuuCreatedTimestamp",
              displayLabel: "vuuCreatedTimestamp",
            },
            {
              dataName: "vuuUpdatedTimestamp",
              displayLabel: "vuuUpdatedTimestamp",
            },
          ],
          true,
        );
      });

      test("THEN entered search text is matched against label if defined (non case-sensitive)", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await typeSearchText(component, "Average p");
        await expectListHeadings(
          component,
          "10 columns in view",
          "8 available columns",
        );
        await expectSelectedItems(component, 1, [
          { dataName: "averagePrice", displayLabel: "Average price" },
        ]);
        await expectAvailableItems(component, 0, [], true);
      });
    });

    test.describe("WHEN supplied with no maxSelections prop", () => {
      test("THEN the component displays correctly on initial render", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await expectSearchControlWithPlaceholderText(component, "Find column");
        await expectListHeadings(
          component,
          "10 columns in view",
          "8 available columns",
        );
        await expectSelectedItems(component, 10, [
          { dataName: "account", displayLabel: "account" },
          { dataName: "algo", displayLabel: "algo" },
          { dataName: "averagePrice", displayLabel: "Average price" },
          { dataName: "ccy", displayLabel: "ccy" },
          { dataName: "childCount", displayLabel: "Child count" },
          { dataName: "exchange", displayLabel: "exchange" },
          { dataName: "filledQty", displayLabel: "filledQty" },
          { dataName: "id", displayLabel: "id" },
          { dataName: "idAsInt", displayLabel: "idAsInt" },
          { dataName: "openQty", displayLabel: "openQty" },
        ]);
        await expectAvailableItems(
          component,
          8,
          [
            { dataName: "price", displayLabel: "price" },
            { dataName: "quantity", displayLabel: "quantity" },
            { dataName: "ric", displayLabel: "ric" },
            { dataName: "side", displayLabel: "side" },
            { dataName: "status", displayLabel: "status" },
            { dataName: "volLimit", displayLabel: "volLimit" },
            {
              dataName: "vuuCreatedTimestamp",
              displayLabel: "vuuCreatedTimestamp",
            },
            {
              dataName: "vuuUpdatedTimestamp",
              displayLabel: "vuuUpdatedTimestamp",
            },
          ],
          true,
        );
      });

      test("THEN the component allows all items to be added/selected", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await addAvailableItem(component, 1, "price");
        await addAvailableItem(component, 1, "quantity");
        await addAvailableItem(component, 1, "ric");
        await addAvailableItem(component, 1, "side");
        await addAvailableItem(component, 1, "status");
        await addAvailableItem(component, 1, "volLimit");
        await addAvailableItem(component, 1, "vuuCreatedTimestamp");
        await addAvailableItem(component, 1, "vuuUpdatedTimestamp");

        await expectListHeadings(
          component,
          "18 columns in view",
          "0 available columns",
        );
        await expectSelectedItems(component, 18, [
          { dataName: "account", displayLabel: "account" },
          { dataName: "algo", displayLabel: "algo" },
          { dataName: "averagePrice", displayLabel: "Average price" },
          { dataName: "ccy", displayLabel: "ccy" },
          { dataName: "childCount", displayLabel: "Child count" },
          { dataName: "exchange", displayLabel: "exchange" },
          { dataName: "filledQty", displayLabel: "filledQty" },
          { dataName: "id", displayLabel: "id" },
          { dataName: "idAsInt", displayLabel: "idAsInt" },
          { dataName: "openQty", displayLabel: "openQty" },
          { dataName: "price", displayLabel: "price" },
          { dataName: "quantity", displayLabel: "quantity" },
          { dataName: "ric", displayLabel: "ric" },
          { dataName: "side", displayLabel: "side" },
          { dataName: "status", displayLabel: "status" },
          { dataName: "volLimit", displayLabel: "volLimit" },
          {
            dataName: "vuuCreatedTimestamp",
            displayLabel: "vuuCreatedTimestamp",
          },
          {
            dataName: "vuuUpdatedTimestamp",
            displayLabel: "vuuUpdatedTimestamp",
          },
        ]);
        await expectAvailableItems(component, 0, [], false);
      });

      test("THEN the component allows selected items to be removed", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/DefaultItemPicker",
        );

        await removeSelectedItem(component, 8, "id");
        await removeSelectedItem(component, 8, "idAsInt");

        await expectListHeadings(
          component,
          "8 columns in view",
          "10 available columns",
        );
        await expectSelectedItems(component, 8, [
          { dataName: "account", displayLabel: "account" },
          { dataName: "algo", displayLabel: "algo" },
          { dataName: "averagePrice", displayLabel: "Average price" },
          { dataName: "ccy", displayLabel: "ccy" },
          { dataName: "childCount", displayLabel: "Child count" },
          { dataName: "exchange", displayLabel: "exchange" },
          { dataName: "filledQty", displayLabel: "filledQty" },
          { dataName: "openQty", displayLabel: "openQty" },
        ]);
        await expectAvailableItems(
          component,
          10,
          [
            { dataName: "id", displayLabel: "id" },
            { dataName: "idAsInt", displayLabel: "idAsInt" },
            { dataName: "price", displayLabel: "price" },
            { dataName: "quantity", displayLabel: "quantity" },
            { dataName: "ric", displayLabel: "ric" },
            { dataName: "side", displayLabel: "side" },
            { dataName: "status", displayLabel: "status" },
            { dataName: "volLimit", displayLabel: "volLimit" },
            {
              dataName: "vuuCreatedTimestamp",
              displayLabel: "vuuCreatedTimestamp",
            },
            {
              dataName: "vuuUpdatedTimestamp",
              displayLabel: "vuuUpdatedTimestamp",
            },
          ],
          true,
        );
      });
    });

    test.describe("WHEN supplied with valid selectedItems and allItems lists for maxSelections", () => {
      test("THEN the component displays correctly on initial render", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/SpecialItemsWithMaxSelection",
        );

        await expectSearchControlWithPlaceholderText(
          component,
          "Find delicacy",
        );
        await expectListHeadings(
          component,
          "1 delicacy in view (2 max)",
          "5 available delicacies",
        );
        await expectSelectedItems(component, 1, [
          { dataName: "caviar", displayLabel: "Caviar" },
        ]);
        await expectAvailableItems(
          component,
          5,
          [
            { dataName: "foisGras", displayLabel: "Fois gras" },
            { dataName: "haggis", displayLabel: "Haggis" },
            { dataName: "kobeBeef", displayLabel: "Kobe beef" },
            { dataName: "quailEgg", displayLabel: "Quail egg" },
            { dataName: "truffle", displayLabel: "Truffle" },
          ],
          true,
        );
      });

      test("THEN the component allows items to be added/selected up to max selections", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/SpecialItemsWithMaxSelection",
        );

        await expectListHeadings(
          component,
          "1 delicacy in view (2 max)",
          "5 available delicacies",
        );
        await addAvailableItem(component, 3, "Kobe beef");

        await expectListHeadings(
          component,
          "2 delicacies in view (2 max)",
          "4 available delicacies",
        );
        await expectSelectedItems(component, 2, [
          { dataName: "caviar", displayLabel: "Caviar" },
          { dataName: "kobeBeef", displayLabel: "Kobe beef" },
        ]);
        await expectAvailableItems(
          component,
          4,
          [
            { dataName: "foisGras", displayLabel: "Fois gras" },
            { dataName: "haggis", displayLabel: "Haggis" },
            { dataName: "quailEgg", displayLabel: "Quail egg" },
            { dataName: "truffle", displayLabel: "Truffle" },
          ],
          false,
        );
      });

      test("THEN the component allows selected items to be removed", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/SpecialItemsWithMaxSelection",
        );

        await expectListHeadings(
          component,
          "1 delicacy in view (2 max)",
          "5 available delicacies",
        );
        await removeSelectedItem(component, 1, "Caviar");

        await expectListHeadings(
          component,
          "0 delicacies in view (2 max)",
          "6 available delicacies",
        );
        await expectSelectedItems(component, 0, []);
        await expectAvailableItems(
          component,
          6,
          [
            { dataName: "caviar", displayLabel: "Caviar" },
            { dataName: "foisGras", displayLabel: "Fois gras" },
            { dataName: "haggis", displayLabel: "Haggis" },
            { dataName: "kobeBeef", displayLabel: "Kobe beef" },
            { dataName: "quailEgg", displayLabel: "Quail egg" },
            { dataName: "truffle", displayLabel: "Truffle" },
          ],
          true,
        );
      });
    });

    test.describe("WHEN supplied with calculated columns", () => {
      test("THEN the component renders the calculated columns correctly when in the available items list", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/CalculatedColumnPicker",
        );

        await expectSearchControlWithPlaceholderText(component, "Find column");
        await expectListHeadings(
          component,
          "3 columns in view",
          "3 available columns",
        );
        await expectSelectedItems(component, 3, [
          { dataName: "regularcolumn1", displayLabel: "Regular column 1" },
          { dataName: "regularcolumn2", displayLabel: "Regular column 2" },
          { dataName: "regularcolumn3", displayLabel: "Regular column 3" },
        ]);
        await expectAvailableItems(
          component,
          3,
          [
            {
              dataName: "calculatedcolumn1",
              displayLabel: "Calculated column 1",
            },
            {
              dataName: "calculatedcolumn2",
              displayLabel: "Calculated column 2",
            },
            { dataName: "regularcolumn4", displayLabel: "Regular column 4" },
          ],
          true,
        );

        await expectIconNotToBeRenderedInAvailableItems(
          component,
          1,
          "Calculated column 1",
        );
        await expectIconNotToBeRenderedInAvailableItems(
          component,
          2,
          "Calculated column 2",
        );
      });

      test("THEN the component renders the calculated columns correctly when in the selected items list", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/CalculatedColumnPicker",
        );

        await addAvailableItem(component, 1, "Calculated column 1");
        await addAvailableItem(component, 1, "Calculated column 2");
        await expectListHeadings(
          component,
          "5 columns in view",
          "1 available column",
        );
        await expectSelectedItems(component, 5, [
          { dataName: "regularcolumn1", displayLabel: "Regular column 1" },
          { dataName: "regularcolumn2", displayLabel: "Regular column 2" },
          { dataName: "regularcolumn3", displayLabel: "Regular column 3" },
          {
            dataName: "calculatedcolumn1",
            displayLabel: "Calculated column 1",
          },
          {
            dataName: "calculatedcolumn2",
            displayLabel: "Calculated column 2",
          },
        ]);
        await expectAvailableItems(
          component,
          1,
          [{ dataName: "regularcolumn4", displayLabel: "Regular column 4" }],
          true,
        );

        await expectIconToBeRenderedInSelectedItems(
          component,
          4,
          "Calculated column 1",
        );
        await expectIconToBeRenderedInSelectedItems(
          component,
          5,
          "Calculated column 2",
        );
      });

      test("THEN the component renders the create custom item button if supplied in props", async ({
        browserName,
        mount,
        page,
      }) => {
        const component = await mount(
          "UiControls/ItemPicker/CalculatedColumnPicker",
        );

        await expectCreateCustomItemsButton(
          component,
          "Create calculated column",
        );
      });
    });
  });
});

const expectSearchControlWithPlaceholderText = async (
  component: Locator,
  searchPlaceholderText: string,
) => {
  const searchInput = await component.locator(".saltInput-input");
  await expect(searchInput).toBeDefined();
  await expect(searchInput).toBeEnabled();
  await expect(searchInput).toHaveAttribute(
    "placeholder",
    searchPlaceholderText,
  );
};

const expectListHeadings = async (
  component: Locator,
  selectedListHeading: string,
  availableListHeading: string,
) => {
  await expect(
    component.locator(".vuuItemPicker-sectionHeader").nth(0),
  ).toHaveText(selectedListHeading);

  await expect(
    component.locator(".vuuItemPicker-sectionHeader").nth(1),
  ).toHaveText(availableListHeading);
};

const expectSelectedItems = async (
  component: Locator,
  totalSelectedItems: number,
  selectedItems?: DisplayedItem[],
) => {
  const selectedList = component.locator(".vuuItemPicker-selectedList");
  const totalRows = await selectedList
    .locator(".vuuItemPickerListItem")
    .count();
  await expect(totalRows).toEqual(totalSelectedItems);

  if (totalRows > 0) {
    for (let i = 0; i < selectedItems!.length; i++) {
      const selectedItem = selectedItems![i];
      const selectedItemRow = await selectedList
        .locator(".vuuItemPickerListItem")
        .nth(i);
      await expect(selectedItemRow).toHaveAttribute(
        "data-name",
        selectedItem.dataName,
      );
      await expect(selectedItemRow).toContainText(selectedItem.displayLabel);
    }
  }
};

const expectAvailableItems = async (
  component: Locator,
  totalAvailableItems: number,
  availableItems?: DisplayedItem[],
  addButtonsEnabled?: boolean,
) => {
  const availableList = component.locator(".vuuItemPicker-availableList");
  const totalRows = await availableList
    .locator(".vuuItemPickerListItem")
    .count();
  await expect(totalRows).toEqual(totalAvailableItems);

  if (totalRows > 0) {
    for (let i = 0; i < availableItems!.length; i++) {
      const selectedItem = availableItems![i];
      const selectedItemRow = await availableList
        .locator(".vuuItemPickerListItem")
        .nth(i);
      await expect(selectedItemRow).toHaveAttribute(
        "data-name",
        selectedItem.dataName,
      );
      await expect(selectedItemRow).toContainText(selectedItem.displayLabel);

      const addButton = await selectedItemRow.locator(
        ".vuuItemPickerListItem-action",
      );
      if (addButtonsEnabled) {
        await expect(selectedItemRow).toBeEnabled();
        await expect(addButton).toBeEnabled();
      } else {
        await expect(selectedItemRow).not.toBeEnabled();
        await expect(addButton).not.toBeEnabled();
      }
    }
  }
};

const addAvailableItem = async (
  component: Locator,
  positionInList: number,
  displayLabel: string,
) => {
  const availableList = component.locator(".vuuItemPicker-availableList");
  const rowToAdd = availableList
    .locator(".vuuItemPickerListItem")
    .nth(positionInList - 1);
  await expect(rowToAdd).toContainText(displayLabel);
  const addButton = rowToAdd.locator(".vuuItemPickerListItem-action");
  await expect(addButton).toBeEnabled();
  await rowToAdd.hover();
  await addButton.hover();
  await addButton.click();
};

const removeSelectedItem = async (
  component: Locator,
  positionInList: number,
  displayLabel: string,
) => {
  const selectedList = component.locator(".vuuItemPicker-selectedList");
  const rowToRemove = selectedList
    .locator(".vuuItemPickerListItem")
    .nth(positionInList - 1);
  await expect(rowToRemove).toContainText(displayLabel);
  const deleteButton = rowToRemove.locator(".vuuItemPickerListItem-action");
  await expect(deleteButton).toBeEnabled();
  await rowToRemove.hover();
  await deleteButton.hover();
  await deleteButton.click();
};

const expectIconNotToBeRenderedInAvailableItems = async (
  component: Locator,
  positionInList: number,
  displayLabel: string,
) => {
  const availableList = component.locator(".vuuItemPicker-availableList");
  const row = availableList
    .locator(".vuuItemPickerListItem")
    .nth(positionInList - 1);
  await expect(row).toContainText(displayLabel);
  const vuuIcons = row.locator(".vuuIcon");
  const iconCount = await vuuIcons.count();
  await expect(iconCount).toEqual(1);
  await expect(vuuIcons.nth(0)).toHaveAttribute("data-icon", "plus");
};

const expectIconToBeRenderedInSelectedItems = async (
  component: Locator,
  positionInList: number,
  displayLabel: string,
) => {
  const selectedList = component.locator(".vuuItemPicker-selectedList");
  const row = selectedList
    .locator(".vuuItemPickerListItem")
    .nth(positionInList - 1);
  await expect(row).toContainText(displayLabel);
  const vuuIcons = row.locator(".vuuIcon");
  const iconCount = await vuuIcons.count();
  await expect(iconCount).toEqual(3);
  await expect(vuuIcons.nth(0)).toHaveAttribute("data-icon", "draggable");
  await expect(vuuIcons.nth(1)).toHaveAttribute("data-icon", "check-check");
  await expect(vuuIcons.nth(2)).toHaveAttribute("data-icon", "cross");
};

const expectCreateCustomItemsButton = async (
  component: Locator,
  buttonLabel: string,
) => {
  const button = component.locator(".vuuItemPicker-item-buttons .saltButton");
  await expect(button).toBeDefined();
  await expect(button).toContainText(buttonLabel);
};

const dragAndDropSelectedItemBelowAnother = async (
  page: any,
  component: Locator,
  itemToMovePosition: number,
  itemToMoveDisplayLabel: string,
  otherItemPosition: number,
  otherItemDisplayLabel: string,
) => {
  if (itemToMovePosition >= otherItemPosition)
    throw Error("Call dragAndDropSelectedItemAboveAnother() instead!");

  const sourceBox = await getBoundingBoxForSelectedItemDragButton(
    component,
    itemToMovePosition,
    itemToMoveDisplayLabel,
  );
  const targetBox = await getBoundingBoxForSelectedItemDragButton(
    component,
    otherItemPosition,
    otherItemDisplayLabel,
  );

  await moveBoundingBoxOnTopOfAnother(page, sourceBox, targetBox);
};

const dragAndDropSelectedItemAboveAnother = async (
  page: any,
  component: Locator,
  itemToMovePosition: number,
  itemToMoveDisplayLabel: string,
  otherItemPosition: number,
  otherItemDisplayLabel: string,
) => {
  if (itemToMovePosition <= otherItemPosition)
    throw Error("Call dragAndDropSelectedItemBelowAnother() instead!");

  const sourceBox = await getBoundingBoxForSelectedItemDragButton(
    component,
    itemToMovePosition,
    itemToMoveDisplayLabel,
  );
  const targetBox = await getBoundingBoxForSelectedItemDragButton(
    component,
    otherItemPosition,
    otherItemDisplayLabel,
  );

  await moveBoundingBoxOnTopOfAnother(page, sourceBox, targetBox);
};

const getBoundingBoxForSelectedItemDragButton = async (
  component: Locator,
  itemPosition: number,
  itemDisplayLabel: string,
) => {
  const selectedList = component.locator(".vuuItemPicker-selectedList");
  const row = selectedList
    .locator(".vuuItemPickerListItem")
    .nth(itemPosition - 1);
  await expect(row).toContainText(itemDisplayLabel);

  const dragIconButton = row.locator(".vuuIcon").nth(0);
  const boundingBox = (await dragIconButton.boundingBox())!;

  return boundingBox;
};

const moveBoundingBoxOnTopOfAnother = async (
  page: any,
  sourceBox: { x: any; y: any; width: any; height: any },
  targetBox: { x: any; y: any; width?: number; height?: number },
) => {
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );

  await page.mouse.down();

  await page.mouse.move(
    targetBox.x + sourceBox.width / 2,
    targetBox.y + sourceBox.height / 2,
    { steps: 10 },
  );

  await page.mouse.up();
};

const typeSearchText = async (component: Locator, searchText: string) => {
  const searchInput = component.locator(".saltInput-input");
  await expect(searchInput).toBeEnabled();
  await searchInput.fill(searchText);
};
